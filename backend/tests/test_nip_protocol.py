import pytest
from app.database import SessionLocal, init_db
from app.seeds.seed_data import seed_database
from app.services.nip_engine import nip_engine
from app.models import NIPSignal

@pytest.fixture(scope="module")
def db_session():
    init_db()
    db = SessionLocal()
    seed_database(db)
    yield db
    db.close()

def test_nip_broadcast_and_anonymization(db_session):
    # Test broadcasting from an anonymized store
    sig = nip_engine.broadcast_signal(
        db=db_session,
        signal_type="SUPPLY_SHORTAGE",
        commodity="Tata Sampann Toor Dal 1kg",
        severity="HIGH",
        origin_merchant_id="shop_balaji",  # shop_balaji is set to ANONYMIZED
        anonymized_payload={"deficit": 30.0}
    )
    assert sig.id is not None
    assert sig.commodity == "Tata Sampann Toor Dal 1kg"
    # Verify origin ID was masked for privacy preservation
    assert "ANON" in sig.origin_merchant_id

def test_nip_detect_cluster_shortages(db_session):
    disruptions = nip_engine.detect_cluster_shortages(db_session)
    assert isinstance(disruptions, list)
    # Atta is critical across stores, so disruption should be detected
    atta_disruptions = [d for d in disruptions if "Atta" in d["commodity"] or "Aashirvaad" in d["commodity"]]
    assert len(atta_disruptions) >= 1
    assert atta_disruptions[0]["risk_severity"] in ["CRITICAL", "HIGH"]

def test_nip_discover_inventory_opportunities(db_session):
    opportunities = nip_engine.discover_inventory_opportunities(db_session)
    assert isinstance(opportunities, list)
    # Shop 3 has surplus oil, Shop 1 is low -> lateral rebalance opportunity
    assert len(opportunities) >= 1
    assert opportunities[0]["type"] == "LATERAL_PEER_REBALANCE"

