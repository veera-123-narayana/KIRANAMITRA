import uuid
import hashlib
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import GovernanceAction, AuditLog, Merchant, InventoryItem
from app.schemas.agent_schemas import GovernanceActionReview, GovernanceActionResponse

router = APIRouter(prefix="/api/governance", tags=["Trust and Governance"])

def hash_event(prev_hash: str, payload: dict) -> str:
    msg = f"{prev_hash}_{str(payload)}_{datetime.now(timezone.utc).isoformat()}"
    return hashlib.sha256(msg.encode("utf-8")).hexdigest()

@router.get("/queue", response_model=List[GovernanceActionResponse])
def get_approval_queue(
    status: Optional[str] = "PENDING_APPROVAL",
    db: Session = Depends(get_db)
):
    """Fetches actions quarantined in the human approval queue"""
    q = db.query(GovernanceAction)
    if status and status != "ALL":
        q = q.filter(GovernanceAction.status == status)
    return q.order_by(GovernanceAction.created_at.desc()).all()

@router.post("/review")
def review_action(payload: GovernanceActionReview, db: Session = Depends(get_db)):
    """
    Store owner human review: APPROVE or REJECT a proposed action.
    GUARANTEES human authorization before executing financial disbursements or inventory updates.
    """
    action = db.query(GovernanceAction).filter(GovernanceAction.id == payload.action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Governance action not found")

    if action.status != "PENDING_APPROVAL":
        raise HTTPException(status_code=400, detail=f"Action is already '{action.status}' and cannot be reviewed")

    decision = payload.decision.upper()
    now = datetime.now(timezone.utc)
    prev_status = action.status

    # Get last audit hash
    last_audit = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).first()
    prev_hash = last_audit.verification_hash if last_audit else "GENESIS_BLOCK_0000"

    if decision == "APPROVE":
        action.status = "APPROVED"
        action.approved_by = payload.reviewed_by
        action.approved_at = now

        # Execute physical inventory update if applicable
        details = action.details_payload or {}
        sku = details.get("sku")
        qty = float(details.get("quantity", 0.0))
        if sku and qty > 0 and action.target_merchant_id:
            inv = db.query(InventoryItem).filter(
                InventoryItem.merchant_id == action.target_merchant_id,
                InventoryItem.sku == sku
            ).first()
            if inv:
                inv.current_stock += qty
                inv.status = "HEALTHY" if inv.current_stock > inv.reorder_threshold else "LOW"
                inv.last_restocked = now

        new_hash = hash_event(prev_hash, {"action_id": action.id, "decision": "APPROVED", "by": payload.reviewed_by})
        audit = AuditLog(
            id=str(uuid.uuid4()),
            action_id=action.id,
            actor=f"{payload.reviewed_by} (Store Owner Authorization)",
            event_type="APPROVED",
            previous_state={"status": prev_status},
            new_state={"status": "APPROVED", "executed_at": now.isoformat()},
            verification_hash=new_hash,
            notes=f"Human approved action '{action.title}'. Dispatched for execution."
        )
        db.add(audit)
        db.commit()

        return {
            "success": True,
            "action_id": action.id,
            "status": "APPROVED",
            "message": f"Successfully authorized '{action.title}'. Execution logged in audit chain.",
            "audit_hash": new_hash
        }

    elif decision == "REJECT":
        action.status = "REJECTED"
        new_hash = hash_event(prev_hash, {"action_id": action.id, "decision": "REJECTED", "reason": payload.reason})
        audit = AuditLog(
            id=str(uuid.uuid4()),
            action_id=action.id,
            actor=f"{payload.reviewed_by} (Human Store Operator)",
            event_type="REJECTED",
            previous_state={"status": prev_status},
            new_state={"status": "REJECTED", "reason": payload.reason},
            verification_hash=new_hash,
            notes=f"Human rejected action '{action.title}'. Reason: {payload.reason or 'User opted out'}."
        )
        db.add(audit)
        db.commit()

        return {
            "success": True,
            "action_id": action.id,
            "status": "REJECTED",
            "message": f"Action '{action.title}' rejected by store owner.",
            "audit_hash": new_hash
        }

    else:
        raise HTTPException(status_code=400, detail="Decision must be 'APPROVE' or 'REJECT'")

@router.post("/reverse/{action_id}")
def reverse_action(action_id: str, db: Session = Depends(get_db)):
    """Reverses an approved transaction and rolls back state"""
    action = db.query(GovernanceAction).filter(GovernanceAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    if action.status not in ["APPROVED", "EXECUTED"]:
        raise HTTPException(status_code=400, detail=f"Cannot reverse action with status '{action.status}'")

    prev_status = action.status
    action.status = "REVERSED"

    # Roll back stock if was added
    details = action.details_payload or {}
    sku = details.get("sku")
    qty = float(details.get("quantity", 0.0))
    if sku and qty > 0 and action.target_merchant_id:
        inv = db.query(InventoryItem).filter(
            InventoryItem.merchant_id == action.target_merchant_id,
            InventoryItem.sku == sku
        ).first()
        if inv:
            inv.current_stock = max(0.0, inv.current_stock - qty)
            if inv.current_stock <= inv.reorder_threshold:
                inv.status = "LOW"

    last_audit = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).first()
    prev_hash = last_audit.verification_hash if last_audit else "GENESIS"
    rev_hash = hash_event(prev_hash, {"reversal": action.id})

    audit = AuditLog(
        id=str(uuid.uuid4()),
        action_id=action.id,
        actor="Store Owner (Transaction Reversal)",
        event_type="REVERSED",
        previous_state={"status": prev_status},
        new_state={"status": "REVERSED"},
        verification_hash=rev_hash,
        notes=f"Safeguard rollback: Action '{action.title}' was reversed."
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "action_id": action.id,
        "new_status": "REVERSED",
        "message": f"Successfully reversed transaction '{action.title}'. Audit chain updated.",
        "audit_hash": rev_hash
    }

@router.get("/audit-trail")
def get_audit_trail(limit: int = 50, db: Session = Depends(get_db)):
    """Returns immutable cryptographic-style audit ledger"""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "action_id": l.action_id,
            "actor": l.actor,
            "event_type": l.event_type,
            "previous_state": l.previous_state,
            "new_state": l.new_state,
            "verification_hash": l.verification_hash,
            "notes": l.notes,
            "timestamp": l.timestamp.isoformat() if l.timestamp else ""
        }
        for l in logs
    ]

