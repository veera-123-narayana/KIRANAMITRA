from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Merchant, InventoryItem, Supplier, SupplierQuote, DemandPrediction

router = APIRouter(prefix="/api/merchants", tags=["Merchants & Suppliers"])

@router.get("")
def list_merchants(db: Session = Depends(get_db)):
    """Lists simulated Kirana stores in the neighbourhood"""
    merchants = db.query(Merchant).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "owner_name": m.owner_name,
            "phone": m.phone,
            "address": m.address,
            "neighbourhood": m.neighbourhood,
            "latitude": m.latitude,
            "longitude": m.longitude,
            "operating_status": m.operating_status,
            "nip_participation_level": m.nip_participation_level
        }
        for m in merchants
    ]

@router.get("/{merchant_id}")
def get_merchant_profile(merchant_id: str, db: Session = Depends(get_db)):
    """Fetches store profile and health state"""
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant store not found")
    return {
        "id": merchant.id,
        "name": merchant.name,
        "owner_name": merchant.owner_name,
        "phone": merchant.phone,
        "address": merchant.address,
        "neighbourhood": merchant.neighbourhood,
        "latitude": merchant.latitude,
        "longitude": merchant.longitude,
        "operating_status": merchant.operating_status,
        "nip_participation_level": merchant.nip_participation_level
    }

@router.get("/{merchant_id}/inventory")
def get_merchant_inventory(merchant_id: str, db: Session = Depends(get_db)):
    """Fetches private inventory vault for a store"""
    items = db.query(InventoryItem).filter(InventoryItem.merchant_id == merchant_id).all()
    return [
        {
            "id": i.id,
            "sku": i.sku,
            "name": i.name,
            "category": i.category,
            "current_stock": i.current_stock,
            "unit": i.unit,
            "reorder_threshold": i.reorder_threshold,
            "optimal_stock": i.optimal_stock,
            "cost_price": i.cost_price,
            "selling_price": i.selling_price,
            "daily_burn_rate": i.daily_burn_rate,
            "predicted_depletion_hours": i.predicted_depletion_hours,
            "status": i.status
        }
        for i in items
    ]

@router.get("/suppliers/all")
def list_suppliers(db: Session = Depends(get_db)):
    """Lists wholesale suppliers and price quote catalogs"""
    suppliers = db.query(Supplier).all()
    result = []
    for s in suppliers:
        quotes = db.query(SupplierQuote).filter(SupplierQuote.supplier_id == s.id).all()
        result.append({
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "address": s.address,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "lead_time_hours": s.lead_time_hours,
            "reliability_rating": s.reliability_rating,
            "delivery_radius_km": s.delivery_radius_km,
            "quotes": [
                {
                    "sku": q.sku,
                    "item_name": q.item_name,
                    "unit_price": q.unit_price,
                    "moq": q.moq,
                    "bulk_tiers": q.bulk_tiers,
                    "available_qty": q.available_qty
                }
                for q in quotes
            ]
        })
    return result

@router.get("/predictions/explainable")
def list_predictions(merchant_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns explainable demand predictions with confidence scores and evidence factors"""
    query = db.query(DemandPrediction)
    if merchant_id:
        query = query.filter(DemandPrediction.merchant_id == merchant_id)
    predictions = query.order_by(DemandPrediction.created_at.desc()).limit(20).all()
    return [
        {
            "id": p.id,
            "merchant_id": p.merchant_id,
            "sku": p.sku,
            "item_name": p.item_name,
            "horizon_days": p.horizon_days,
            "predicted_demand": p.predicted_demand,
            "current_stock": p.current_stock,
            "shortage_probability": p.shortage_probability,
            "confidence_score": p.confidence_score,
            "supporting_evidence": p.supporting_evidence,
            "expected_impact": p.expected_impact,
            "recommended_intervention": p.recommended_intervention,
            "created_at": p.created_at.isoformat() if p.created_at else ""
        }
        for p in predictions
    ]
