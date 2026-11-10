from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Merchant, Supplier, InventoryItem, NIPSignal, CoordinationProposal

router = APIRouter(prefix="/api/digital-twin", tags=["Digital Twin"])

@router.get("/state")
def get_digital_twin_state(db: Session = Depends(get_db)):
    """
    Returns full geospatial and 3D simulation state for the interactive Neighbourhood Digital Twin.
    Contains shop coordinates, supplier depots, live inventory status, supply shortage heatmaps,
    and optimized coordination logistics routes.
    """
    merchants = db.query(Merchant).all()
    suppliers = db.query(Supplier).all()
    signals = db.query(NIPSignal).filter(NIPSignal.status == "ACTIVE").all()
    proposals = db.query(CoordinationProposal).all()

    # Base reference point (Indiranagar 12th Main: 12.9716, 77.6412)
    ref_lat = 12.9716
    ref_lng = 77.6412

    def to_3d(lat: float, lng: float, base_y: float = 0.0):
        # 1 deg lat ~ 111km -> scale to 3D units
        scale = 800.0
        x = (lng - ref_lng) * scale
        z = -(lat - ref_lat) * scale
        return {"x": round(x, 2), "y": base_y, "z": round(z, 2)}

    nodes = []

    for m in merchants:
        items = db.query(InventoryItem).filter(InventoryItem.merchant_id == m.id).all()
        critical_count = sum(1 for i in items if i.status == "CRITICAL")
        low_count = sum(1 for i in items if i.status == "LOW")
        surplus_count = sum(1 for i in items if i.status == "SURPLUS")

        coords_3d = to_3d(m.latitude, m.longitude, base_y=0.5)

        nodes.append({
            "id": m.id,
            "type": "MERCHANT_STORE",
            "name": m.name,
            "owner": m.owner_name,
            "phone": m.phone,
            "address": m.address,
            "neighbourhood": m.neighbourhood,
            "coords_geo": {"lat": m.latitude, "lng": m.longitude},
            "coords_3d": coords_3d,
            "operating_status": m.operating_status,
            "metrics": {
                "total_skus": len(items),
                "critical_shortages": critical_count,
                "low_items": low_count,
                "surplus_items": surplus_count,
                "demand_intensity": round(0.4 + (critical_count * 0.25), 2),
                "nip_status": m.nip_participation_level
            },
            "inventory_summary": [
                {"name": i.name, "stock": i.current_stock, "unit": i.unit, "status": i.status}
                for i in items
            ]
        })

    for s in suppliers:
        coords_3d = to_3d(s.latitude, s.longitude, base_y=1.0)
        nodes.append({
            "id": s.id,
            "type": "SUPPLIER_DEPOT",
            "name": s.name,
            "category": s.category,
            "address": s.address,
            "coords_geo": {"lat": s.latitude, "lng": s.longitude},
            "coords_3d": coords_3d,
            "operating_status": "ACTIVE",
            "metrics": {
                "reliability_rating": s.reliability_rating,
                "lead_time_hours": s.lead_time_hours,
                "delivery_radius_km": s.delivery_radius_km
            }
        })

    # Supply and Coordination Routes
    routes = [
        {
            "id": "route_metro_to_cluster",
            "origin_node_id": "sup_metro",
            "origin_name": "Metro Wholesale Hub",
            "destination_nodes": ["shop_lakshmi", "shop_venkateshwara", "shop_balaji"],
            "commodity": "Aashirvaad Superior MP Atta 10kg",
            "status": "PROPOSED_GROUP_DISPATCH",
            "savings_vs_individual": "12.5% Freight & Volume Consolidation",
            "coordinates_path": [
                to_3d(12.9352, 77.6946, base_y=0.2),  # Metro depot
                to_3d(12.9600, 77.6600, base_y=0.2),  # Midpoint
                to_3d(12.9716, 77.6412, base_y=0.2),  # Shop 1
                to_3d(12.9740, 77.6445, base_y=0.2),  # Shop 2
                to_3d(12.9785, 77.6390, base_y=0.2)   # Shop 3
            ]
        },
        {
            "id": "route_lateral_peer_transfer",
            "origin_node_id": "shop_balaji",
            "origin_name": "Balaji Kirana (Surplus Oil)",
            "destination_nodes": ["shop_lakshmi"],
            "commodity": "Fortune Sunlite Sunflower Oil 1L",
            "status": "LATERAL_PEER_REBALANCE",
            "savings_vs_individual": "Instant peer handover (30 mins)",
            "coordinates_path": [
                to_3d(12.9785, 77.6390, base_y=0.3),
                to_3d(12.9716, 77.6412, base_y=0.3)
            ]
        }
    ]

    return {
        "cluster_name": "Indiranagar Local Commerce Grid",
        "reference_center": {"lat": ref_lat, "lng": ref_lng},
        "nodes": nodes,
        "routes": routes,
        "active_signals_count": len(signals),
        "coordination_proposals_count": len(proposals),
        "cluster_health": "WARNING" if any(n.get("metrics", {}).get("critical_shortages", 0) > 0 for n in nodes if n["type"] == "MERCHANT_STORE") else "OPTIMAL"
    }

