from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AgentExecutionLog
from app.schemas.agent_schemas import AgentInput, AgentOutput
from app.agents import (
    merchant_agent,
    demand_agent,
    supplier_agent,
    negotiation_agent,
    governance_agent,
    orchestrator_agent
)

router = APIRouter(prefix="/api/agents", tags=["Agent Network"])

AGENT_REGISTRY = {
    "Merchant Agent": merchant_agent,
    "Demand Intelligence Agent": demand_agent,
    "Supplier Agent": supplier_agent,
    "Negotiation Agent": negotiation_agent,
    "Trust and Governance Agent": governance_agent,
    "Orchestrator Agent": orchestrator_agent
}

@router.get("/topology")
async def get_topology(db: Session = Depends(get_db)):
    """Returns the multi-agent topology, status, and permissions"""
    in_data = AgentInput(
        caller_agent="System",
        action="GET_AGENT_TOPOLOGY"
    )
    res = await orchestrator_agent.execute(in_data, db)
    return res.data

@router.post("/execute", response_model=AgentOutput)
async def execute_agent(payload: AgentInput, db: Session = Depends(get_db)):
    """Routes structured execution to an autonomous agent"""
    target = payload.caller_agent
    # If caller_agent is not in registry, look up by action or default to orchestrator
    agent = AGENT_REGISTRY.get(target)
    if not agent:
        # Match by action
        if payload.action in merchant_agent.allowed_actions:
            agent = merchant_agent
        elif payload.action in demand_agent.allowed_actions:
            agent = demand_agent
        elif payload.action in supplier_agent.allowed_actions:
            agent = supplier_agent
        elif payload.action in negotiation_agent.allowed_actions:
            agent = negotiation_agent
        elif payload.action in governance_agent.allowed_actions:
            agent = governance_agent
        else:
            agent = orchestrator_agent

    result = await agent.execute(payload, db)
    return result

@router.get("/logs")
def get_agent_logs(limit: int = 50, db: Session = Depends(get_db)):
    """Returns real-time execution telemetry and messages between agents"""
    logs = db.query(AgentExecutionLog).order_by(AgentExecutionLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "agent_name": l.agent_name,
            "execution_cycle_id": l.execution_cycle_id,
            "input_payload": l.input_payload,
            "output_payload": l.output_payload,
            "status": l.status,
            "latency_ms": l.latency_ms,
            "details": l.details,
            "timestamp": l.timestamp.isoformat() if l.timestamp else ""
        }
        for l in logs
    ]

