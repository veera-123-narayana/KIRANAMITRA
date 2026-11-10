from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.gnani_stt_service import gnani_stt_service
from app.services.gnani_tts_service import gnani_tts_service
from app.services.gnani_evon_service import gnani_evon_service
from app.services.voice_orchestrator import voice_orchestrator
from app.schemas.agent_schemas import STTResponse, TTSRequest, TTSResponse, VoiceCommandRequest, VoiceCommandResponse

router = APIRouter(prefix="/api/voice", tags=["Voice Intelligence"])

@router.get("/status")
def get_voice_integration_status():
    """Returns official Gnani AI integration status and health"""
    return {
        "gnani_stt": {
            "name": "Gnani Prisma STT v3.0",
            "is_configured": gnani_stt_service.is_configured(),
            "status": "LIVE_ACTIVE" if gnani_stt_service.is_configured() else "INTEGRATION_PENDING",
            "endpoint": gnani_stt_service.endpoint,
            "supported_languages": ["te-IN", "en-IN", "indic-auto"],
            "instruction": "Set GNANI_API_KEY in backend/.env to switch from pending to live Vachana cloud inference."
        },
        "gnani_tts": {
            "name": "Gnani Timbre TTS v2.5",
            "is_configured": gnani_tts_service.is_configured(),
            "status": "LIVE_ACTIVE" if gnani_tts_service.is_configured() else "INTEGRATION_PENDING",
            "endpoint": gnani_tts_service.endpoint,
            "supported_languages": ["te-IN", "en-IN"],
            "instruction": "Set GNANI_API_KEY in backend/.env to activate live Timbre voice playback."
        },
        "gnani_evon": {
            "name": "Gnani Evon v3.3 Indic Reasoner",
            "is_configured": gnani_evon_service.is_configured(),
            "status": "LIVE_ACTIVE" if gnani_evon_service.is_configured() else "INTEGRATION_PENDING",
            "endpoint": gnani_evon_service.base_url,
            "model": gnani_evon_service.model,
            "instruction": "Deploy Evon v3.3 via vLLM or configure GNANI_EVON_BASE_URL for live Indic reasoning."
        }
    }

@router.post("/stt", response_model=STTResponse)
async def speech_to_text(
    audio_file: UploadFile = File(...),
    language_code: str = Form("te-IN"),
    format_type: str = Form("codemix")
):
    """
    Transcribe audio via Gnani AI Prisma v3.0 REST STT API.
    Handles Telugu (te-IN), English (en-IN), or Indic auto-detection.
    """
    audio_bytes = await audio_file.read()
    result = await gnani_stt_service.transcribe_audio(
        audio_bytes=audio_bytes,
        filename=audio_file.filename or "speech.wav",
        content_type=audio_file.content_type or "audio/wav",
        language_code=language_code,
        format_type=format_type
    )
    return result

@router.post("/tts", response_model=TTSResponse)
async def text_to_speech(payload: TTSRequest):
    """
    Synthesize speech via Gnani AI Timbre v2.5 / v3.0 REST API.
    Produces high-fidelity Telugu or Indian English voice audio.
    """
    result = await gnani_tts_service.synthesize_speech(
        text=payload.text,
        language=payload.language,
        voice=payload.voice,
        speed=payload.speed
    )
    return result

@router.post("/command", response_model=VoiceCommandResponse)
async def execute_voice_command(
    payload: VoiceCommandRequest,
    db: Session = Depends(get_db)
):
    """
    End-to-End Voice Orchestration:
    Processes transcribed voice query -> Extracts structured intent -> Coordinates Agents ->
    Generates Spoken Reply & Timbre voice audio.
    """
    result = await voice_orchestrator.process_voice_command(
        db=db,
        merchant_id=payload.merchant_id,
        transcript=payload.transcript,
        language_code=payload.language
    )
    return result
