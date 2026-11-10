import time
import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import AgentExecutionLog
from app.schemas.agent_schemas import AgentInput, AgentOutput

class BaseAgent:
    """Base class for all Kiranamitra specialized autonomous agents"""

    def __init__(
        self,
        name: str,
        role_description: str,
        allowed_actions: List[str],
        permission_tier: str
    ):
        self.name = name
        self.role_description = role_description
        self.allowed_actions = allowed_actions
        self.permission_tier = permission_tier

    def check_permission(self, action: str) -> bool:
        return action in self.allowed_actions

    def log_execution(
        self,
        db: Session,
        execution_cycle_id: str,
        input_payload: Dict[str, Any],
        output_payload: Dict[str, Any],
        status: str,
        latency_ms: int,
        details: str = ""
    ) -> str:
        log_entry = AgentExecutionLog(
            id=str(uuid.uuid4()),
            agent_name=self.name,
            execution_cycle_id=execution_cycle_id,
            input_payload=input_payload,
            output_payload=output_payload,
            status=status,
            latency_ms=latency_ms,
            details=details
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry.id

    async def execute(self, input_data: AgentInput, db: Session) -> AgentOutput:
        start_time = time.time()
        cycle_id = input_data.execution_cycle_id or str(uuid.uuid4())

        if not self.check_permission(input_data.action):
            latency = int((time.time() - start_time) * 1000)
            output = AgentOutput(
                agent_name=self.name,
                action=input_data.action,
                status="ERROR",
                summary=f"Permission denied: {self.name} cannot execute action '{input_data.action}' under tier {self.permission_tier}",
                data={"error": "PERMISSION_DENIED"},
                next_recommended_agents=[]
            )
            self.log_execution(db, cycle_id, input_data.model_dump(), output.model_dump(), "ERROR", latency, "Action unauthorized")
            return output

        try:
            output = await self._process(input_data, db, cycle_id)
            latency = int((time.time() - start_time) * 1000)
            log_id = self.log_execution(db, cycle_id, input_data.model_dump(), output.model_dump(), output.status, latency, output.summary)
            output.execution_log_id = log_id
            return output
        except Exception as e:
            latency = int((time.time() - start_time) * 1000)
            error_output = AgentOutput(
                agent_name=self.name,
                action=input_data.action,
                status="ERROR",
                summary=f"Internal agent error in {self.name}: {str(e)}",
                data={"exception": str(e)},
                next_recommended_agents=[]
            )
            self.log_execution(db, cycle_id, input_data.model_dump(), error_output.model_dump(), "ERROR", latency, f"Exception: {str(e)}")
            return error_output

    async def _process(self, input_data: AgentInput, db: Session, cycle_id: str) -> AgentOutput:
        raise NotImplementedError("Subclasses must implement _process")

