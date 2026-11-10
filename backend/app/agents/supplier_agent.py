from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.models import Supplier, SupplierQuote
from app.schemas.agent_schemas import AgentInput, AgentOutput

class SupplierAgent(BaseAgent):
    """
    Supplier Agent:
    Evaluates verified wholesale suppliers, checks available stock quotas,
    queries MOQ (minimum order quantities), lead times, and tiered discount pricing.
    """

    def __init__(self):
        super().__init__(
            name="Supplier Agent",
            role_description="Evaluates wholesale suppliers, catalogue availability, delivery reliability and tier pricing.",
            allowed_actions=[
                "FIND_SUPPLIERS",
                "GET_PRICE_QUOTES",
                "CHECK_BULK_TIERS",
                "COMPARE_SUPPLIERS"
            ],
            permission_tier="MARKETPLACE_QUERY"
        )

    async def _process(self, input_data: AgentInput, db: Session, cycle_id: str) -> AgentOutput:
        sku = input_data.payload.get("sku")
        item_name = input_data.payload.get("item_name", "")
        required_qty = float(input_data.payload.get("required_qty", 10.0))

        if input_data.action in ["GET_PRICE_QUOTES", "FIND_SUPPLIERS", "COMPARE_SUPPLIERS"]:
            quotes_query = db.query(SupplierQuote).join(Supplier)
            if sku:
                quotes_query = quotes_query.filter(SupplierQuote.sku == sku)
            elif item_name:
                quotes_query = quotes_query.filter(SupplierQuote.item_name.ilike(f"%{item_name}%"))

            quotes = quotes_query.all()
            if not quotes:
                # Fallback to all quotes
                quotes = db.query(SupplierQuote).join(Supplier).all()

            results = []
            for q in quotes:
                supplier = q.supplier
                # Calculate bulk discount if quantity matches tiers
                applicable_discount = 0.0
                if q.bulk_tiers and isinstance(q.bulk_tiers, list):
                    for tier in q.bulk_tiers:
                        if required_qty >= tier.get("min_qty", 0):
                            applicable_discount = max(applicable_discount, tier.get("discount_pct", 0.0))

                discounted_unit_price = round(q.unit_price * (1.0 - (applicable_discount / 100.0)), 2)
                total_estimated_cost = round(discounted_unit_price * required_qty, 2)

                results.append({
                    "supplier_id": supplier.id,
                    "supplier_name": supplier.name,
                    "category": supplier.category,
                    "lead_time_hours": supplier.lead_time_hours,
                    "reliability_rating": supplier.reliability_rating,
                    "sku": q.sku,
                    "item_name": q.item_name,
                    "base_unit_price": q.unit_price,
                    "moq": q.moq,
                    "available_stock": q.available_qty,
                    "bulk_tiers": q.bulk_tiers,
                    "applicable_discount_pct": applicable_discount,
                    "effective_unit_price": discounted_unit_price,
                    "total_estimated_cost": total_estimated_cost,
                    "meets_moq": required_qty >= q.moq
                })

            # Sort by effective unit price
            results.sort(key=lambda x: x["effective_unit_price"])

            summary = f"Supplier Agent located {len(results)} wholesale options for {item_name or sku or 'requested supplies'}."
            if results and not results[0]["meets_moq"]:
                summary += f" Single-store demand ({required_qty}) is below MOQ ({results[0]['moq']}). Multi-merchant pooling recommended."

            return AgentOutput(
                agent_name=self.name,
                action=input_data.action,
                status="SUCCESS",
                summary=summary,
                data={
                    "item_name": item_name or (results[0]["item_name"] if results else "Item"),
                    "sku": sku or (results[0]["sku"] if results else ""),
                    "requested_qty": required_qty,
                    "suppliers_found": len(results),
                    "quotes": results,
                    "cheapest_option": results[0] if results else None
                },
                next_recommended_agents=["Negotiation Agent"]
            )

        elif input_data.action == "CHECK_BULK_TIERS":
            supplier_id = input_data.payload.get("supplier_id")
            supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first() if supplier_id else None
            quotes = db.query(SupplierQuote).filter(SupplierQuote.supplier_id == supplier_id).all() if supplier_id else []

            return AgentOutput(
                agent_name=self.name,
                action=input_data.action,
                status="SUCCESS",
                summary=f"Retrieved volume discount tiers for {supplier.name if supplier else 'all suppliers'}.",
                data={
                    "supplier_name": supplier.name if supplier else "Multiple",
                    "catalogue_items": [
                        {"sku": q.sku, "name": q.item_name, "base_price": q.unit_price, "tiers": q.bulk_tiers}
                        for q in quotes
                    ]
                },
                next_recommended_agents=["Negotiation Agent"]
            )

        return AgentOutput(
            agent_name=self.name,
            action=input_data.action,
            status="ERROR",
            summary=f"Unsupported action {input_data.action} for Supplier Agent."
        )

supplier_agent = SupplierAgent()

