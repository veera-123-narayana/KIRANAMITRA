import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models import Merchant, InventoryItem, NIPSignal, CoordinationProposal, GovernanceAction, AuditLog, DemandPrediction
from app.seeds.seed_data import seed_database
from app.services.nip_engine import nip_engine
from app.agents.orchestrator_agent import orchestrator_agent
from app.schemas.agent_schemas import AgentInput

router = APIRouter(prefix="/api/simulation", tags=["Simulation Lab"])

@router.post("/trigger")
async def trigger_scenario(payload: dict, db: Session = Depends(get_db)):
    """
    Executes a real-time market event scenario:
    - SUPPLY_SHOCK: Simulates sudden oil depot shortage, creates critical alerts & NIP warnings.
    - FESTIVAL_SURGE: Simulates 65% demand spike on Atta & Sugar, triggers Demand Agent & group buy.
    - PEER_REBALANCE: Executes micro-consignment from surplus store to depleted store.
    - RESET_SIMULATION: Resets database state to default seed data.
    """
    scenario_type = payload.get("scenario", "SUPPLY_SHOCK").upper()

    if scenario_type == "SUPPLY_SHOCK":
        # Simulate severe sunflower oil shortage
        oil_items = db.query(InventoryItem).filter(InventoryItem.sku == "SKU-OIL-01").all()
        for it in oil_items:
            it.current_stock = max(2.0, it.current_stock * 0.25)
            it.status = "CRITICAL"

        # Broadcast critical NIP disruption signal
        sig = nip_engine.broadcast_signal(
            db=db,
            signal_type="SUPPLY_SHORTAGE",
            commodity="Fortune Sunlite Sunflower Oil 1L",
            severity="CRITICAL",
            origin_merchant_id="shop_lakshmi",
            anonymized_payload={
                "event": "Regional Edible Oil Depot Shock",
                "price_hike_risk": "+18%",
                "cluster_deficit_packets": 140,
                "action": "Immediate collective purchase order recommended"
            },
            radius_meters=3500,
            confidence=0.98
        )

        return {
            "success": True,
            "scenario": "SUPPLY_SHOCK",
            "message": "Supply Shock simulated: Regional Sunflower Oil inventory plummeted. NIP Critical Alert broadcasted across Indiranagar cluster.",
            "signal_id": sig.id,
            "affected_skus": ["SKU-OIL-01"]
        }

    elif scenario_type == "FESTIVAL_DEMAND_SURGE":
        # Festive demand surge
        atta_items = db.query(InventoryItem).filter(InventoryItem.sku == "SKU-ATTA-01").all()
        for it in atta_items:
            it.daily_burn_rate = round(it.daily_burn_rate * 1.65, 1)
            it.predicted_depletion_hours = round((it.current_stock / max(it.daily_burn_rate, 0.1)) * 24, 1)
            if it.current_stock <= it.reorder_threshold:
                it.status = "CRITICAL"

        # Trigger multi-agent pipeline automatically
        in_data = AgentInput(
            caller_agent="Simulation Lab",
            action="EXECUTE_END_TO_END_CYCLE",
            target_merchant_id="shop_lakshmi",
            payload={"item_name": "Aashirvaad Superior MP Atta 10kg", "requested_qty": 60.0}
        )
        orch_res = await orchestrator_agent.execute(in_data, db)

        return {
            "success": True,
            "scenario": "FESTIVAL_DEMAND_SURGE",
            "message": "Festival Demand Surge simulated: +65% burn rate applied to Staples. Multi-agent negotiation formed collective order.",
            "orchestration": orch_res.data
        }

    elif scenario_type == "PEER_REBALANCE":
        # Transfer 20 packets of oil from Balaji Kirana (Surplus) to Lakshmi General (Critical)
        balaji_oil = db.query(InventoryItem).filter(
            InventoryItem.merchant_id == "shop_balaji",
            InventoryItem.sku == "SKU-OIL-01"
        ).first()

        lakshmi_oil = db.query(InventoryItem).filter(
            InventoryItem.merchant_id == "shop_lakshmi",
            InventoryItem.sku == "SKU-OIL-01"
        ).first()

        transfer_qty = 25.0
        if balaji_oil and lakshmi_oil and balaji_oil.current_stock >= transfer_qty:
            balaji_oil.current_stock -= transfer_qty
            lakshmi_oil.current_stock += transfer_qty
            lakshmi_oil.status = "HEALTHY"
            if balaji_oil.current_stock <= balaji_oil.optimal_stock:
                balaji_oil.status = "HEALTHY"

            # Log to audit trail
            audit = AuditLog(
                id=str(uuid.uuid4()),
                actor="NIP Protocol (Lateral Peer Rebalance)",
                event_type="LATERAL_TRANSFER",
                previous_state={"source_stock": balaji_oil.current_stock + transfer_qty, "dest_stock": lakshmi_oil.current_stock - transfer_qty},
                new_state={"source_stock": balaji_oil.current_stock, "dest_stock": lakshmi_oil.current_stock},
                verification_hash=str(uuid.uuid4()),
                notes=f"Rebalanced {transfer_qty} units Sunflower Oil laterally between peer stores in 30 mins."
            )
            db.add(audit)
            db.commit()

            return {
                "success": True,
                "scenario": "PEER_REBALANCE",
                "message": f"Successfully executed peer rebalance of {transfer_qty} units Sunflower Oil from Balaji Kirana to Lakshmi General Store.",
                "new_lakshmi_stock": lakshmi_oil.current_stock,
                "new_balaji_stock": balaji_oil.current_stock
            }
        else:
            return {
                "success": False,
                "scenario": "PEER_REBALANCE",
                "message": "Insufficient surplus available to execute lateral transfer."
            }

    elif scenario_type == "RESET_SIMULATION":
        # Clear tables and re-seed
        db.query(AuditLog).delete()
        db.query(GovernanceAction).delete()
        db.query(DemandPrediction).delete()
        db.query(CoordinationProposal).delete()
        db.query(NIPSignal).delete()
        db.query(InventoryItem).delete()
        db.query(SupplierQuote).delete()
        db.query(Supplier).delete()
        db.query(Merchant).delete()
        db.commit()

        seed_database(db)

        return {
            "success": True,
            "scenario": "RESET_SIMULATION",
            "message": "Simulation reset successfully. Database restored to pristine 3-shop Indiranagar state."
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unknown scenario '{scenario_type}'")

