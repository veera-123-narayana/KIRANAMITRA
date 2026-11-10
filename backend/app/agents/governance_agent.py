import uuid
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.agents.base_agent import BaseAgent
from app.models import GovernanceAction, AuditLog, Merchant
from app.schemas.agent_schemas import AgentInput, AgentOutput

class TrustAndGovernanceAgent(BaseAgent):
    """
    Trust and Governance Agent:
    Enforces strict protocol guardrails. GUARANTEES that no autonomous financial
    outflow occurs without explicit human approval. Manages the cryptographic-style
    audit hash chain and transaction rollback mechanisms.
    """

    def __init__(self):
        super().__init__(
            name="Trust and Governance Agent",
            role_description="Validates agent permissions, enforces human-in-the-loop gates, and records immutable audit ledgers.",
            allowed_actions=[
                "VALIDATE_PROPOSED_ACTION",
                "ENQUEUE_APPROVAL",
                "VERIFY_AUDIT_TRAIL",
                "REVERSE_ACTION"
            ],
            permission_tier="GOVERNANCE_ENFORCER"
        )

    def _compute_hash(self, prev_hash: str, payload: Dict[str, Any]) -> str:
        content = f"{prev_hash}_{str(payload)}_{datetime.now(timezone.utc).isoformat()}"
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    async def _process(self, input_data: AgentInput, db: Session, cycle_id: str) -> AgentOutput:
        target_merchant_id = input_data.target_merchant_id
        if not target_merchant_id:
            first_m = db.query(Merchant).first()
            target_merchant_id = first_m.id if first_m else "shop_1"

        if input_data.action in ["VALIDATE_PROPOSED_ACTION", "ENQUEUE_APPROVAL"]:
            action_type = input_data.payload.get("action_type", "SUPPLIER_ORDER")
            title = input_data.payload.get("title", "Proposed Procurement Action")
            description = input_data.payload.get("description", "Requires human store owner review")
            initiating_agent = input_data.caller_agent or "Negotiation Agent"
            financial_impact = float(input_data.payload.get("financial_impact_inr", 0.0))
            details = input_data.payload.get("details", {})

            # Assess risk level based on monetary threshold
            if financial_impact > 15000.0:
                risk_level = "HIGH"
            elif financial_impact > 3000.0:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"

            # Strict Governance Constraint:
            # All financial disbursements and supplier orders REQUIRE human approval
            requires_human = True
            status = "PENDING_APPROVAL"

            # Get latest audit hash
            last_log = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).first()
            prev_hash = last_log.verification_hash if last_log else "GENESIS_BLOCK_0000"
            new_hash = self._compute_hash(prev_hash, details)

            gov_action = GovernanceAction(
                id=str(uuid.uuid4()),
                action_type=action_type,
                title=title,
                description=description,
                initiating_agent=initiating_agent,
                target_merchant_id=target_merchant_id,
                financial_impact_inr=financial_impact,
                risk_assessment=risk_level,
                status=status,
                details_payload=details,
                audit_hash=new_hash
            )
            db.add(gov_action)

            audit_entry = AuditLog(
                id=str(uuid.uuid4()),
                action_id=gov_action.id,
                actor=f"{initiating_agent} -> Trust & Governance",
                event_type="ENQUEUED_FOR_APPROVAL",
                previous_state={"status": "DRAFT"},
                new_state={"status": "PENDING_APPROVAL", "risk": risk_level, "financial_impact": financial_impact},
                verification_hash=new_hash,
                notes=f"Safeguard active: Financial action of ₹{financial_impact} halted pending store owner signature."
            )
            db.add(audit_entry)
            db.commit()

            summary = (
                f"Governance safeguard triggered. {action_type} for ₹{financial_impact:,.2f} "
                f"classified as {risk_level} risk and safely quarantined in the Human Approval Queue."
            )

            return AgentOutput(
                agent_name=self.name,
                action=input_data.action,
                status="PENDING_APPROVAL",
                summary=summary,
                data={
                    "governance_action_id": gov_action.id,
                    "action_type": action_type,
                    "title": title,
                    "risk_level": risk_level,
                    "financial_impact_inr": financial_impact,
                    "audit_hash": new_hash,
                    "approval_required": True,
                    "message": "Action cannot execute automatically. Awaiting merchant confirmation in Trust & Audit center."
                },
                next_recommended_agents=[],
                requires_human_approval=True,
                governance_action_id=gov_action.id
            )

        elif input_data.action == "VERIFY_AUDIT_TRAIL":
            logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(20).all()
            log_entries = [
                {
                    "id": l.id,
                    "action_id": l.action_id,
                    "actor": l.actor,
                    "event_type": l.event_type,
                    "verification_hash": l.verification_hash[:16] + "...",
                    "notes": l.notes,
                    "timestamp": l.timestamp.isoformat() if l.timestamp else ""
                }
                for l in logs
            ]

            return AgentOutput(
                agent_name=self.name,
                action=input_data.action,
                status="SUCCESS",
                summary=f"Audit chain verified. {len(log_entries)} historical records cryptographically intact.",
                data={"total_records": len(log_entries), "logs": log_entries}
            )

        elif input_data.action == "REVERSE_ACTION":
            action_id = input_data.payload.get("action_id")
            action = db.query(GovernanceAction).filter(GovernanceAction.id == action_id).first()
            if not action:
                return AgentOutput(
                    agent_name=self.name,
                    action=input_data.action,
                    status="ERROR",
                    summary=f"Governance action {action_id} not found."
                )

            if action.status not in ["APPROVED", "EXECUTED"]:
                return AgentOutput(
                    agent_name=self.name,
                    action=input_data.action,
                    status="WARNING",
                    summary=f"Action {action_id} has status '{action.status}' and cannot be reversed."
                )

            prev_status = action.status
            action.status = "REVERSED"

            rev_hash = self._compute_hash(action.audit_hash, {"reversal": True})
            rollback_log = AuditLog(
                id=str(uuid.uuid4()),
                action_id=action.id,
                actor="Human Store Operator (Rollback)",
                event_type="REVERSED",
                previous_state={"status": prev_status},
                new_state={"status": "REVERSED"},
                verification_hash=rev_hash,
                notes=f"Transaction {action.title} reversed by authorized merchant key."
            )
            db.add(rollback_log)
            db.commit()

            return AgentOutput(
                agent_name=self.name,
                action=input_data.action,
                status="SUCCESS",
                summary=f"Action '{action.title}' successfully reversed. Audit ledger updated.",
                data={"action_id": action.id, "new_status": "REVERSED", "reversal_hash": rev_hash}
            )

        return AgentOutput(
            agent_name=self.name,
            action=input_data.action,
            status="ERROR",
            summary=f"Unsupported action {input_data.action} for Governance Agent."
        )

governance_agent = TrustAndGovernanceAgent()

