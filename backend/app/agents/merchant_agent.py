from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.models import Merchant, InventoryItem
from app.schemas.agent_schemas import AgentInput, AgentOutput

class MerchantAgent(BaseAgent):
    """
    Merchant Agent:
    Manages individual store information, current inventory levels, reorder thresholds,
    and private shop parameters. Never exposes private balance sheets or profit margins
    to external network peers.
    """

    def __init__(self):
        super().__init__(
            name="Merchant Agent",
            role_description="Manages individual business inventory, store profiles, and safe localized stock auditing.",
            allowed_actions=[
                "GET_INVENTORY",
                "CHECK_ITEM_STOCK",
                "ASSESS_STORE_HEALTH",
                "UPDATE_STOCK_LEVEL"
            ],
            permission_tier="MERCHANT_VAULT_ISOLATED"
        )

    async def _process(self, input_data: AgentInput, db: Session, cycle_id: str) -> AgentOutput:
        merchant_id = input_data.target_merchant_id
        if not merchant_id:
            # Default to first merchant if not provided
            first_merchant = db.query(Merchant).first()
            merchant_id = first_merchant.id if first_merchant else None

        merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
        if not merchant:
            return AgentOutput(
                agent_name=self.name,
                action=input_data.action,
                status="ERROR",
                summary=f"Merchant record '{merchant_id}' not found.",
                data={"merchant_id": merchant_id}
            )

        if input_data.action == "GET_INVENTORY":
            items = db.query(InventoryItem).filter(InventoryItem.merchant_id == merchant_id).all()
            items_data = [
                {
                    "id": item.id,
                    "sku": item.sku,
                    "name": item.name,
                    "category": item.category,
                    "current_stock": item.current_stock,
                    "unit": item.unit,
                    "reorder_threshold": item.reorder_threshold,
                    "optimal_stock": item.optimal_stock,
                    "selling_price": item.selling_price,
                    "cost_price": item.cost_price,
                    "daily_burn_rate": item.daily_burn_rate,
                    "predicted_depletion_hours": item.predicted_depletion_hours,
                    "status": item.status
                }
                for item in items
            ]
            return AgentOutput(
                agent_name=self.name,
                action=input_data.action,
                status="SUCCESS",
                summary=f"Retrieved {len(items_data)} inventory items for {merchant.name}.",
                data={
                    "merchant_id": merchant.id,
                    "merchant_name": merchant.name,
                    "neighbourhood": merchant.neighbourhood,
                    "items": items_data
                },
                next_recommended_agents=["Demand Intelligence Agent"]
            )

        elif input_data.action == "CHECK_ITEM_STOCK":
            item_query = input_data.payload.get("item_name", "").lower()
            sku = input_data.payload.get("sku", "")
            query = db.query(InventoryItem).filter(InventoryItem.merchant_id == merchant_id)
            if sku:
                query = query.filter(InventoryItem.sku == sku)
            elif item_query:
                query = query.filter(InventoryItem.name.ilike(f"%{item_query}%"))
            item = query.first()

            if not item:
                return AgentOutput(
                    agent_name=self.name,
                    action=input_data.action,
                    status="WARNING",
                    summary=f"Item matching '{item_query or sku}' was not found in {merchant.name}.",
                    data={"found": False, "query": item_query or sku}
                )

            is_low = item.current_stock <= item.reorder_threshold
            next_agents = ["Demand Intelligence Agent", "Supplier Agent"] if is_low else []
            return AgentOutput(
                agent_name=self.name,
                action=input_data.action,
                status="SUCCESS",
                summary=f"{item.name} has {item.current_stock} {item.unit} in stock ({item.status}).",
                data={
                    "found": True,
                    "item_id": item.id,
                    "sku": item.sku,
                    "name": item.name,
                    "current_stock": item.current_stock,
                    "unit": item.unit,
                    "reorder_threshold": item.reorder_threshold,
                    "is_low_stock": is_low,
                    "status": item.status,
                    "cost_price": item.cost_price,
                    "selling_price": item.selling_price
                },
                next_recommended_agents=next_agents
            )

        elif input_data.action == "ASSESS_STORE_HEALTH":
            items = db.query(InventoryItem).filter(InventoryItem.merchant_id == merchant_id).all()
            total_items = len(items)
            critical_items = [i for i in items if i.current_stock <= i.reorder_threshold * 0.5]
            low_items = [i for i in items if i.current_stock <= i.reorder_threshold and i not in critical_items]
            healthy_items = [i for i in items if i.current_stock > i.reorder_threshold]

            health_status = "HEALTHY"
            if len(critical_items) > 0:
                health_status = "STOCKOUT_RISK"
            elif len(low_items) > 2:
                health_status = "WARNING"

            merchant.operating_status = health_status
            db.commit()

            return AgentOutput(
                agent_name=self.name,
                action=input_data.action,
                status="SUCCESS",
                summary=f"Store health evaluated as {health_status}. {len(critical_items)} critical, {len(low_items)} low items.",
                data={
                    "merchant_id": merchant.id,
                    "merchant_name": merchant.name,
                    "status": health_status,
                    "total_skus": total_items,
                    "critical_count": len(critical_items),
                    "low_count": len(low_items),
                    "healthy_count": len(healthy_items),
                    "critical_items": [{"name": i.name, "stock": i.current_stock, "unit": i.unit} for i in critical_items]
                },
                next_recommended_agents=["Demand Intelligence Agent"] if (critical_items or low_items) else []
            )

        elif input_data.action == "UPDATE_STOCK_LEVEL":
            sku = input_data.payload.get("sku")
            quantity_change = float(input_data.payload.get("quantity_change", 0.0))
            item = db.query(InventoryItem).filter(
                InventoryItem.merchant_id == merchant_id,
                InventoryItem.sku == sku
            ).first()

            if not item:
                return AgentOutput(
                    agent_name=self.name,
                    action=input_data.action,
                    status="ERROR",
                    summary=f"SKU {sku} not found for store {merchant.name}."
                )

            item.current_stock = max(0.0, item.current_stock + quantity_change)
            if item.current_stock <= (item.reorder_threshold * 0.5):
                item.status = "CRITICAL"
            elif item.current_stock <= item.reorder_threshold:
                item.status = "LOW"
            elif item.current_stock >= item.optimal_stock * 1.3:
                item.status = "SURPLUS"
            else:
                item.status = "HEALTHY"

            db.commit()
            return AgentOutput(
                agent_name=self.name,
                action=input_data.action,
                status="SUCCESS",
                summary=f"Updated stock for {item.name}: new level is {item.current_stock} {item.unit}.",
                data={"sku": item.sku, "name": item.name, "new_stock": item.current_stock, "status": item.status}
            )

        return AgentOutput(
            agent_name=self.name,
            action=input_data.action,
            status="ERROR",
            summary=f"Unsupported action '{input_data.action}' for Merchant Agent."
        )

merchant_agent = MerchantAgent()
