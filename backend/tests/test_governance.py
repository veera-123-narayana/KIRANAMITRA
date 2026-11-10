import pytest
from app.database import SessionLocal, init_db
from app.seeds.seed_data import seed_database
from app.agents.governance_agent import governance_agent
from app.schemas.agent_schemas import AgentInput
from app.models import GovernanceAction, AuditLog

@pytest.fixture(scope="module")
def db_session():
    init_db()
    db = SessionLocal()
    seed_database(db)
    yield db
    db.close()

@pytest.mark.asyncio
async def test_governance_quarantine_financial_action(db_session):
    # Propose financial action
    in_data = AgentInput(
        caller_agent="Negotiation Agent",
        action="ENQUEUE_APPROVAL",
        target_merchant_id="shop_lakshmi",
        payload={
            "action_type": "SUPPLIER_ORDER",
            "title": "Purchase 50 bags Atta",
            "financial_impact_inr": 18500.0,
            "details": {"qty": 50, "sku": "SKU-ATTA-01"}
        }
    )
    out = await governance_agent.execute(in_data, db_session)
    # MUST be quarantined in pending approval
    assert out.status == "PENDING_APPROVAL"
    assert out.requires_human_approval is True
    assert out.governance_action_id is not None

    # Check database
    action = db_session.query(GovernanceAction).filter(GovernanceAction.id == out.governance_action_id).first()
    assert action is not None
    assert action.status == "PENDING_APPROVAL"
    assert action.risk_assessment == "HIGH"  # > 15,000 INR

@pytest.mark.asyncio
async def test_governance_audit_trail_integrity(db_session):
    in_data = AgentInput(
        caller_agent="Auditor",
        action="VERIFY_AUDIT_TRAIL"
    )
    out = await governance_agent.execute(in_data, db_session)
    assert out.status == "SUCCESS"
    assert out.data["total_records"] >= 1
    # Check cryptographic hash format
    logs = out.data["logs"]
    assert len(logs[0]["verification_hash"]) > 0

