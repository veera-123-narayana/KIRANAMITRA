import uuid
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.models import Merchant, InventoryItem, Supplier, SupplierQuote, CoordinationProposal, NIPSignal
from app.schemas.agent_schemas import AgentInput, AgentOutput

class NegotiationAgent(BaseAgent):
    """
    Negotiation Agent:
    Evaluates multi-store collective bargaining opportunities. Identifies when
    individual Kirana stores are suffering from sub-MOQ penalties or high unit costs,
    and constructs privacy-preserving collective procurement pools under NIP.
    """

    def __init__(self):
        super().__init__(
            name="Negotiation Agent",
            role_description="Synthesizes collective buying pools, evaluates tier discounts, and structures negotiation deals.",
            allowed_actions=[
                "EVALUATE_POOLING_OPPORTUNITY",
                "NEGOTIATE_GROUP_BUY",
                "COMPARE_OFFERS"
            ],
            permission_tier="RECOMMENDATION_ENGINE"
        )

    async def _process(self, input_data: AgentInput, db: Session, cycle_id: str) -> AgentOutput:
        sku = input_data.payload.get("sku")
        commodity = input_data.payload.get("commodity") or input_data.payload.get("item_name", "Aashirvaad Atta 10kg")
        trigger_merchant_id = input_data.target_merchant_id

        if input_data.action in ["EVALUATE_POOLING_OPPORTUNITY", "NEGOTIATE_GROUP_BUY"]:
            # Query all shops that stock this item or similar commodity
            inventory_candidates = db.query(InventoryItem).filter(
                (InventoryItem.sku == sku) | (InventoryItem.name.ilike(f"%{commodity[:6]}%"))
            ).all()

            if not inventory_candidates:
                # Fallback to any low or critical items across merchants
                inventory_candidates = db.query(InventoryItem).filter(InventoryItem.status.in_(["LOW", "CRITICAL"])).all()

            # Find matching supplier quote
            matching_quote = db.query(SupplierQuote).join(Supplier).first()
            if sku:
                specific_quote = db.query(SupplierQuote).filter(SupplierQuote.sku == sku).first()
                if specific_quote:
                    matching_quote = specific_quote

            supplier = matching_quote.supplier if matching_quote else db.query(Supplier).first()
            supplier_name = supplier.name if supplier else "Metro Wholesale Hub"
            base_price = matching_quote.unit_price if matching_quote else 380.0
            moq = matching_quote.moq if matching_quote else 50

            # Aggregate demand across cluster stores
            participants = []
            total_pool_qty = 0.0

            for inv in inventory_candidates:
                # Needed quantity to reach optimal stock
                deficit = max(inv.optimal_stock - inv.current_stock, 15.0)
                participants.append({
                    "merchant_id": inv.merchant_id,
                    "merchant_name": inv.merchant.name,
                    "neighbourhood": inv.merchant.neighbourhood,
                    "requested_qty": round(deficit, 1),
                    "current_stock": inv.current_stock,
                    "optimal_stock": inv.optimal_stock
                })
                total_pool_qty += deficit

            if total_pool_qty < moq:
                total_pool_qty = moq

            # Bulk discount calculation (e.g. 10-15% discount for meeting bulk threshold)
            discount_pct = 12.5 if total_pool_qty >= 50 else 8.0
            negotiated_price = round(base_price * (1.0 - (discount_pct / 100.0)), 2)
            total_standard_cost = round(base_price * total_pool_qty, 2)
            total_negotiated_cost = round(negotiated_price * total_pool_qty, 2)
            projected_savings = round(total_standard_cost - total_negotiated_cost, 2)

            # Create or update CoordinationProposal record
            proposal_title = f"NIP Group Buy: {commodity} ({int(total_pool_qty)} units from {supplier_name})"
            proposal = CoordinationProposal(
                id=str(uuid.uuid4()),
                title=proposal_title,
                item_name=commodity,
                target_supplier_id=supplier.id if supplier else "sup_metro",
                target_supplier_name=supplier_name,
                collective_target_qty=total_pool_qty,
                participating_merchants=participants,
                standard_unit_price=base_price,
                negotiated_unit_price=negotiated_price,
                projected_savings_inr=projected_savings,
                projected_savings_pct=discount_pct,
                status="READY_FOR_APPROVAL"
            )
            db.add(proposal)

            # Generate an active NIPSignal on the protocol bus
            nip_sig = NIPSignal(
                id=str(uuid.uuid4()),
                origin_merchant_id=trigger_merchant_id,
                signal_type="BULK_POOLING_REQUEST",
                commodity=commodity,
                severity="HIGH",
                anonymized_payload={
                    "proposal_id": proposal.id,
                    "pooled_quantity": total_pool_qty,
                    "discount_rate": f"{discount_pct}%",
                    "participant_count": len(participants),
                    "supplier": supplier_name
                },
                radius_meters=3000,
                confidence=0.95
            )
            db.add(nip_sig)
            db.commit()

            summary = (
                f"Negotiation Agent formed group buy for {commodity}. Pooled {int(total_pool_qty)} units "
                f"across {len(participants)} stores. Negotiated price ₹{negotiated_price}/unit (saved ₹{projected_savings} / {discount_pct}%)."
            )

            return AgentOutput(
                agent_name=self.name,
                action=input_data.action,
                status="SUCCESS",
                summary=summary,
                data={
                    "proposal_id": proposal.id,
                    "commodity": commodity,
                    "supplier_name": supplier_name,
                    "total_quantity": total_pool_qty,
                    "standard_unit_price": base_price,
                    "negotiated_unit_price": negotiated_price,
                    "projected_savings_inr": projected_savings,
                    "projected_savings_pct": discount_pct,
                    "participating_stores_count": len(participants),
                    "participants": participants,
                    "status": "READY_FOR_APPROVAL"
                },
                next_recommended_agents=["Trust and Governance Agent"],
                requires_human_approval=True
            )

        return AgentOutput(
            agent_name=self.name,
            action=input_data.action,
            status="ERROR",
            summary=f"Unsupported action {input_data.action} for Negotiation Agent."
        )

negotiation_agent = NegotiationAgent()

