from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime

# --- Agent Schemas ---
class AgentInput(BaseModel):
    caller_agent: str
    action: str
    target_merchant_id: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    execution_cycle_id: Optional[str] = None

class AgentOutput(BaseModel):
    agent_name: str
    action: str
    status: str  # SUCCESS, WARNING, ERROR, PENDING_APPROVAL
    summary: str
    data: Dict[str, Any] = Field(default_factory=dict)
    next_recommended_agents: List[str] = Field(default_factory=list)
    requires_human_approval: bool = False
    governance_action_id: Optional[str] = None
    execution_log_id: Optional[str] = None

# --- Voice Schemas ---
class STTRequest(BaseModel):
    language_code: str = "te-IN"  # "te-IN", "en-IN", "indic-auto"
    format: str = "codemix"  # "transcribe", "codemix", "verbatim"

class STTResponse(BaseModel):
    transcript: str
    confidence: float
    detected_language: str
    provider: str  # "gnani_prisma" or "integration_pending"
    is_live_api: bool
    latency_ms: int
    raw_response: Optional[Dict[str, Any]] = None

class TTSRequest(BaseModel):
    text: str
    language: str = "te-IN"  # "te-IN", "en-IN"
    voice: Optional[str] = None
    speed: float = 1.0

class TTSResponse(BaseModel):
    audio_base64: Optional[str] = None
    audio_url: Optional[str] = None
    content_type: str = "audio/wav"
    provider: str  # "gnani_timbre" or "integration_pending"
    is_live_api: bool
    message: str

class VoiceCommandRequest(BaseModel):
    merchant_id: str
    transcript: str
    language: str = "te-IN"

class VoiceCommandResponse(BaseModel):
    transcription: str
    detected_intent: str
    extracted_entities: Dict[str, Any]
    orchestration_result: Dict[str, Any]
    spoken_reply_text: str
    tts_audio_base64: Optional[str] = None
    provider_status: Dict[str, Any]

# --- NIP Schemas ---
class NIPSignalCreate(BaseModel):
    origin_merchant_id: Optional[str] = None
    signal_type: str
    commodity: str
    severity: str = "MEDIUM"
    anonymized_payload: Dict[str, Any] = Field(default_factory=dict)
    radius_meters: int = 2500

class NIPSignalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    origin_merchant_id: Optional[str]
    signal_type: str
    commodity: str
    severity: str
    anonymized_payload: Dict[str, Any]
    radius_meters: int
    confidence: float
    status: str
    created_at: datetime

# --- Governance Schemas ---
class GovernanceActionReview(BaseModel):
    action_id: str
    decision: str  # "APPROVE" or "REJECT"
    reviewed_by: str = "Merchant Store Owner"
    reason: Optional[str] = None

class GovernanceActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    action_type: str
    title: str
    description: str
    initiating_agent: str
    target_merchant_id: str
    financial_impact_inr: float
    risk_assessment: str
    status: str
    details_payload: Dict[str, Any]
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    audit_hash: str
    created_at: datetime
