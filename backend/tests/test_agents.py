import pytest
from app.database import SessionLocal, init_db
from app.seeds.seed_data import seed_database
from app.schemas.agent_schemas import AgentInput
from app.agents import (
    merchant_agent,
    demand_agent,
    supplier_agent,
    negotiation_agent,
    governance_agent,
    orchestrator_agent
)

@pytest.fixture(scope="module")
def db_session():
    init_db()
    db = SessionLocal()
    seed_database(db)
    yield db
    db.close()

@pytest.mark.asyncio
async def test_merchant_agent_get_inventory(db_session):
    in_data = AgentInput(
        caller_agent="TestRunner",
        action="GET_INVENTORY",
        target_merchant_id="shop_lakshmi"
    )
    out = await merchant_agent.execute(in_data, db_session)
    assert out.status == "SUCCESS"
    assert "items" in out.data
    assert len(out.data["items"]) >= 3

@pytest.mark.asyncio
async def test_merchant_agent_permission_denial(db_session):
    # Action not allowed on Merchant Agent
    in_data = AgentInput(
        caller_agent="TestRunner",
        action="INVALID_UNAUTHORIZED_ACTION",
        target_merchant_id="shop_lakshmi"
    )
    out = await merchant_agent.execute(in_data, db_session)
    assert out.status == "ERROR"
    assert "Permission denied" in out.summary

@pytest.mark.asyncio
async def test_demand_agent_stockout_prediction(db_session):
    in_data = AgentInput(
        caller_agent="TestRunner",
        action="PREDICT_DEMAND",
        target_merchant_id="shop_lakshmi",
        payload={"sku": "SKU-ATTA-01", "horizon_days": 7}
    )
    out = await demand_agent.execute(in_data, db_session)
    assert out.status == "SUCCESS"
    assert out.data["total_analyzed"] >= 1
    # Lakshmi Atta is low, so shortage probability should be elevated
    pred = out.data["predictions"][0]
    assert pred["shortage_probability"] >= 0.5
    assert len(pred["evidence"]) > 0

@pytest.mark.asyncio
async def test_supplier_agent_quotes_and_moq(db_session):
    in_data = AgentInput(
        caller_agent="TestRunner",
        action="GET_PRICE_QUOTES",
        payload={"item_name": "Atta", "required_qty": 40.0}
    )
    out = await supplier_agent.execute(in_data, db_session)
    assert out.status == "SUCCESS"
    assert out.data["suppliers_found"] >= 1
    assert out.data["cheapest_option"]["effective_unit_price"] > 0

@pytest.mark.asyncio
async def test_negotiation_agent_group_buy(db_session):
    in_data = AgentInput(
        caller_agent="TestRunner",
        action="NEGOTIATE_GROUP_BUY",
        target_merchant_id="shop_lakshmi",
        payload={"item_name": "Aashirvaad Superior MP Atta 10kg"}
    )
    out = await negotiation_agent.execute(in_data, db_session)
    assert out.status == "SUCCESS"
    assert out.requires_human_approval is True
    assert out.data["projected_savings_inr"] > 0
    assert out.data["participating_stores_count"] >= 1

@pytest.mark.asyncio
async def test_orchestrator_end_to_end_cycle(db_session):
    in_data = AgentInput(
        caller_agent="TestRunner",
        action="EXECUTE_END_TO_END_CYCLE",
        target_merchant_id="shop_lakshmi",
        payload={"item_name": "Aashirvaad Superior MP Atta 10kg", "requested_qty": 40.0}
    )
    out = await orchestrator_agent.execute(in_data, db_session)
    assert out.status == "SUCCESS"
    assert out.requires_human_approval is True
    assert out.governance_action_id is not None
    assert len(out.data["steps"]) == 5

