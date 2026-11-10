import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import NIPSignal, Merchant, InventoryItem, CoordinationProposal, GovernanceAction, AuditLog

class NeighbourhoodIntelligenceProtocolEngine:
    """
    Neighbourhood Intelligence Protocol (NIP) Engine:
    Facilitates secure, privacy-preserving business signal sharing among independent
    Kirana stores in a local cluster without leaking private sales or margin data.
    """

    def __init__(self):
        self.protocol_version = "NIP/1.0"

    def broadcast_signal(
        self,
        db: Session,
        signal_type: str,
        commodity: str,
        severity: str,
        origin_merchant_id: Optional[str],
        anonymized_payload: Dict[str, Any],
        radius_meters: int = 2500,
        confidence: float = 0.95
    ) -> NIPSignal:
        """
        Broadcasts a validated signal onto the NIP network bus.
        The origin merchant ID can be anonymized according to store privacy settings.
        """
        # Privacy check: If store is in ANONYMIZED mode, mask merchant ID
        masked_merchant_id = origin_merchant_id
        if origin_merchant_id:
            merchant = db.query(Merchant).filter(Merchant.id == origin_merchant_id).first()
            if merchant and merchant.nip_participation_level == "ANONYMIZED":
                masked_merchant_id = f"ANON_{merchant.neighbourhood.replace(' ', '_')}_{origin_merchant_id[:4]}"

        sig = NIPSignal(
            id=str(uuid.uuid4()),
            origin_merchant_id=masked_merchant_id,
            signal_type=signal_type,
            commodity=commodity,
            severity=severity,
            anonymized_payload=anonymized_payload,
            radius_meters=radius_meters,
            confidence=confidence,
            status="ACTIVE"
        )
        db.add(sig)
        db.commit()
        db.refresh(sig)
        return sig

    def detect_cluster_shortages(self, db: Session, neighbourhood: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Scans all stores in the cluster to identify systemic commodity shortages
        before consumers experience out-of-stock conditions.
        """
        query = db.query(InventoryItem).join(Merchant)
        if neighbourhood:
            query = query.filter(Merchant.neighbourhood == neighbourhood)

        items = query.all()
        # Group by commodity/category
        commodity_map: Dict[str, List[InventoryItem]] = {}
        for it in items:
            key = it.name.split()[0] if it.name else it.category
            if key not in commodity_map:
                commodity_map[key] = []
            commodity_map[key].append(it)

        disruptions = []
        for comm, store_items in commodity_map.items():
            critical_count = sum(1 for i in store_items if i.status in ["LOW", "CRITICAL"])
            total_count = len(store_items)

            if critical_count >= 2 or (critical_count / max(total_count, 1)) >= 0.5:
                # 50% or more stores in cluster are low on this commodity
                disruptions.append({
                    "commodity": comm,
                    "affected_stores_count": critical_count,
                    "total_stores_in_cluster": total_count,
                    "risk_severity": "CRITICAL" if critical_count >= 2 else "HIGH",
                    "opportunity": "Trigger Multi-Merchant NIP Group Buy",
                    "cluster_stock_level": sum(i.current_stock for i in store_items),
                    "cluster_deficit": sum(max(i.optimal_stock - i.current_stock, 0) for i in store_items)
                })

        return disruptions

    def discover_inventory_opportunities(self, db: Session) -> List[Dict[str, Any]]:
        """
        Detects inter-store balancing opportunities (e.g. Shop A has SURPLUS while Shop B has LOW/CRITICAL deficit).
        Allows lateral micro-transfers before wholesale reorders.
        """
        surplus_items = db.query(InventoryItem).filter(InventoryItem.status == "SURPLUS").all()
        depleted_items = db.query(InventoryItem).filter(InventoryItem.status.in_(["LOW", "CRITICAL"])).all()

        opportunities = []
        for c in depleted_items:
            for s in surplus_items:
                # Match by SKU or commodity name and ensure different stores
                if (c.sku == s.sku or c.name.split()[0].lower() == s.name.split()[0].lower()) and c.merchant_id != s.merchant_id:
                    transfer_qty = min(s.current_stock - s.reorder_threshold, c.optimal_stock - c.current_stock)
                    if transfer_qty > 0:
                        opportunities.append({
                            "type": "LATERAL_PEER_REBALANCE",
                            "item_name": c.name,
                            "sku": c.sku,
                            "source_merchant": s.merchant.name,
                            "source_merchant_id": s.merchant_id,
                            "destination_merchant": c.merchant.name,
                            "destination_merchant_id": c.merchant_id,
                            "transfer_quantity": round(transfer_qty, 1),
                            "unit": c.unit,
                            "savings_vs_supplier": "Available in 30 mins vs 24h wholesale delivery",
                            "requires_approval": True
                        })
        return opportunities

nip_engine = NeighbourhoodIntelligenceProtocolEngine()
