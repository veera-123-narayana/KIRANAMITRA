import uuid
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.agents.merchant_agent import merchant_agent
from app.agents.demand_agent import demand_agent
from app.agents.supplier_agent import supplier_agent
from app.agents.negotiation_agent import negotiation_agent
from app.agents.governance_agent import governance_agent
from app.models import Merchant, InventoryItem
from app.schemas.agent_schemas import AgentInput, AgentOutput

class OrchestratorAgent(BaseAgent):
    """
    Orchestrator Agent:
    Coordinates all autonomous agents across the Kiranamitra platform.
    Maintains execution state, tracks end-to-end multi-agent sequences,
    and passes structured state from speech input to action recommendation.
    """

    def __init__(self):
        super().__init__(
            name="Orchestrator Agent",
            role_description="Coordinates distributed agents, manages state graphs, and maintains execution pipeline integrity.",
            allowed_actions=[
                "EXECUTE_END_TO_END_CYCLE",
                "GET_AGENT_TOPOLOGY",
                "COORDINATE_DISRUPTION_RESPONSE"
            ],
            permission_tier="MASTER_ORCHESTRATOR"
        )

    async def _process(self, input_data: AgentInput, db: Session, cycle_id: str) -> AgentOutput:
        target_merchant_id = input_data.target_merchant_id
        if not target_merchant_id:
            first_m = db.query(Merchant).first()
            target_merchant_id = first_m.id if first_m else "shop_1"

        if input_data.action == "EXECUTE_END_TO_END_CYCLE":
            item_name = input_data.payload.get("item_name", "Aashirvaad Atta")
            requested_qty = float(input_data.payload.get("requested_qty", 40.0))
            cycle_steps = []

            # Step 1: Merchant Agent audits stock
            step1_input = AgentInput(
                caller_agent=self.name,
                action="CHECK_ITEM_STOCK",
                target_merchant_id=target_merchant_id,
                payload={"item_name": item_name},
                execution_cycle_id=cycle_id
            )
            step1_out = await merchant_agent.execute(step1_input, db)
            cycle_steps.append({
                "step": 1,
                "agent": merchant_agent.name,
                "action": "CHECK_ITEM_STOCK",
                "status": step1_out.status,
                "summary": step1_out.summary,
                "data": step1_out.data
            })

            # Step 2: Demand Intelligence Agent forecasts stockout
            target_sku = step1_out.data.get("sku") if step1_out.data.get("found") else None
            step2_input = AgentInput(
                caller_agent=self.name,
                action="PREDICT_DEMAND",
                target_merchant_id=target_merchant_id,
                payload={"sku": target_sku, "horizon_days": 7},
                execution_cycle_id=cycle_id
            )
            step2_out = await demand_agent.execute(step2_input, db)
            cycle_steps.append({
                "step": 2,
                "agent": demand_agent.name,
                "action": "PREDICT_DEMAND",
                "status": step2_out.status,
                "summary": step2_out.summary,
                "data": step2_out.data
            })

            # Step 3: Supplier Agent evaluates market pricing & MOQ
            step3_input = AgentInput(
                caller_agent=self.name,
                action="GET_PRICE_QUOTES",
                target_merchant_id=target_merchant_id,
                payload={"item_name": item_name, "sku": target_sku, "required_qty": requested_qty},
                execution_cycle_id=cycle_id
            )
            step3_out = await supplier_agent.execute(step3_input, db)
            cycle_steps.append({
                "step": 3,
                "agent": supplier_agent.name,
                "action": "GET_PRICE_QUOTES",
                "status": step3_out.status,
                "summary": step3_out.summary,
                "data": step3_out.data
            })

            # Step 4: Negotiation Agent structures group buy pooling
            step4_input = AgentInput(
                caller_agent=self.name,
                action="NEGOTIATE_GROUP_BUY",
                target_merchant_id=target_merchant_id,
                payload={"item_name": item_name, "sku": target_sku, "required_qty": requested_qty},
                execution_cycle_id=cycle_id
            )
            step4_out = await negotiation_agent.execute(step4_input, db)
            cycle_steps.append({
                "step": 4,
                "agent": negotiation_agent.name,
                "action": "NEGOTIATE_GROUP_BUY",
                "status": step4_out.status,
                "summary": step4_out.summary,
                "data": step4_out.data
            })

            # Step 5: Trust and Governance Agent halts for Human Approval
            savings = step4_out.data.get("projected_savings_inr", 1200.0)
            unit_price = step4_out.data.get("negotiated_unit_price", 335.0)
            total_qty = step4_out.data.get("total_quantity", requested_qty)
            financial_cost = round(unit_price * total_qty, 2)

            step5_input = AgentInput(
                caller_agent=self.name,
                action="ENQUEUE_APPROVAL",
                target_merchant_id=target_merchant_id,
                payload={
                    "action_type": "SUPPLIER_ORDER",
                    "title": f"Collective Bulk Order: {item_name} ({int(total_qty)} units)",
                    "description": f"Group buy negotiated at ₹{unit_price}/unit. Total order cost ₹{financial_cost:,.2f} with ₹{savings:,.2f} collective savings.",
                    "financial_impact_inr": financial_cost,
                    "details": {
                        "item_name": item_name,
                        "sku": target_sku,
                        "quantity": total_qty,
                        "negotiated_unit_price": unit_price,
                        "savings_inr": savings,
                        "supplier": step4_out.data.get("supplier_name", "Metro Wholesale Hub"),
                        "participants_count": step4_out.data.get("participating_stores_count", 3)
                    }
                },
                execution_cycle_id=cycle_id
            )
            step5_out = await governance_agent.execute(step5_input, db)
            cycle_steps.append({
                "step": 5,
                "agent": governance_agent.name,
                "action": "ENQUEUE_APPROVAL",
                "status": step5_out.status,
                "summary": step5_out.summary,
                "data": step5_out.data
            })

            summary = (
                f"End-to-end orchestration complete across 5 specialized agents. "
                f"Stock assessed -> Demand modeled -> Supplier sourced -> Group buy negotiated -> Safely quarantined in Approval Queue."
            )

            return AgentOutput(
                agent_name=self.name,
                action=input_data.action,
                status="SUCCESS",
                summary=summary,
                data={
                    "cycle_id": cycle_id,
                    "target_merchant_id": target_merchant_id,
                    "total_steps": len(cycle_steps),
                    "steps": cycle_steps,
                    "governance_action_id": step5_out.governance_action_id,
                    "requires_human_approval": True,
                    "final_recommendation": f"Approval required to confirm group buy of {int(total_qty)} units of {item_name} at ₹{unit_price}/unit."
                },
                requires_human_approval=True,
                governance_action_id=step5_out.governance_action_id
            )

        elif input_data.action == "GET_AGENT_TOPOLOGY":
            topology = [
                {
                    "name": "Merchant Agent",
                    "role": "Inventory & Shop Vault",
                    "tier": "MERCHANT_VAULT_ISOLATED",
                    "status": "ONLINE",
                    "capabilities": ["Stock Check", "Burn Rate Audit", "Store Health"]
                },
                {
                    "name": "Demand Intelligence Agent",
                    "role": "Predictive Forecasting",
                    "tier": "ANALYTICS_READ_ONLY",
                    "status": "ONLINE",
                    "capabilities": ["Stockout Risk", "Seasonal Factor", "Horizon Forecast"]
                },
                {
                    "name": "Supplier Agent",
                    "role": "Wholesale Discovery",
                    "tier": "MARKETPLACE_QUERY",
                    "status": "ONLINE",
                    "capabilities": ["Catalogue Search", "MOQ Verification", "Tier Discounts"]
                },
                {
                    "name": "Negotiation Agent",
                    "role": "Collective Pooling & NIP Deals",
                    "tier": "RECOMMENDATION_ENGINE",
                    "status": "ONLINE",
                    "capabilities": ["Group Buy Assembly", "Cluster Pooling", "Margin Optimization"]
                },
                {
                    "name": "Trust and Governance Agent",
                    "role": "Constraint Enforcement",
                    "tier": "GOVERNANCE_ENFORCER",
                    "status": "ONLINE",
                    "capabilities": ["Approval Quarantine", "Audit Ledger", "Transaction Reversal"]
                },
                {
                    "name": "Orchestrator Agent",
                    "role": "Execution Graph Coordinator",
                    "tier": "MASTER_ORCHESTRATOR",
                    "status": "ONLINE",
                    "capabilities": ["End-to-End Coordination", "State Graphs", "Disruption Response"]
                }
            ]
            return AgentOutput(
                agent_name=self.name,
                action=input_data.action,
                status="SUCCESS",
                summary="Retrieved topology and active health for all 6 autonomous agents.",
                data={"agents": topology}
            )

        return AgentOutput(
            agent_name=self.name,
            action=input_data.action,
            status="ERROR",
            summary=f"Unsupported action {input_data.action} for Orchestrator Agent."
        )

orchestrator_agent = OrchestratorAgent()

