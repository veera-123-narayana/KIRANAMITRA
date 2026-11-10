from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import NIPSignal, CoordinationProposal
from app.services.nip_engine import nip_engine
from app.schemas.agent_schemas import NIPSignalCreate, NIPSignalResponse

router = APIRouter(prefix="/api/nip", tags=["Neighbourhood Intelligence Protocol"])

@router.get("/signals", response_model=List[NIPSignalResponse])
def get_active_signals(
    commodity: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Fetches active, privacy-preserving business signals on the NIP bus"""
    q = db.query(NIPSignal).filter(NIPSignal.status == "ACTIVE")
    if commodity:
        q = q.filter(NIPSignal.commodity.ilike(f"%{commodity}%"))
    return q.order_by(NIPSignal.created_at.desc()).limit(limit).all()

@router.post("/signals", response_model=NIPSignalResponse)
def broadcast_signal(payload: NIPSignalCreate, db: Session = Depends(get_db)):
    """Broadcasts a business signal under NIP protocol"""
    sig = nip_engine.broadcast_signal(
        db=db,
        signal_type=payload.signal_type,
        commodity=payload.commodity,
        severity=payload.severity,
        origin_merchant_id=payload.origin_merchant_id,
        anonymized_payload=payload.anonymized_payload,
        radius_meters=payload.radius_meters
    )
    return sig

@router.get("/disruptions")
def get_supply_disruptions(db: Session = Depends(get_db)):
    """Detects cluster-wide supply deficits and disruption probabilities"""
    return nip_engine.detect_cluster_shortages(db)

@router.get("/opportunities")
def get_coordination_opportunities(db: Session = Depends(get_db)):
    """Identifies lateral store-to-store rebalancing and group buy moments"""
    return nip_engine.discover_inventory_opportunities(db)

@router.get("/proposals")
def get_proposals(db: Session = Depends(get_db)):
    """Retrieves all active multi-store coordination and pooling proposals"""
    proposals = db.query(CoordinationProposal).order_by(CoordinationProposal.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "item_name": p.item_name,
            "target_supplier_id": p.target_supplier_id,
            "target_supplier_name": p.target_supplier_name,
            "collective_target_qty": p.collective_target_qty,
            "participating_merchants": p.participating_merchants,
            "standard_unit_price": p.standard_unit_price,
            "negotiated_unit_price": p.negotiated_unit_price,
            "projected_savings_inr": p.projected_savings_inr,
            "projected_savings_pct": p.projected_savings_pct,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else ""
        }
        for p in proposals
    ]

