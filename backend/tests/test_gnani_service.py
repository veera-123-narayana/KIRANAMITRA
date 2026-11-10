import pytest
from app.services.gnani_stt_service import gnani_stt_service
from app.services.gnani_tts_service import gnani_tts_service
from app.services.voice_orchestrator import voice_orchestrator
from app.database import SessionLocal, init_db
from app.seeds.seed_data import seed_database

@pytest.fixture(scope="module")
def db_session():
    init_db()
    db = SessionLocal()
    seed_database(db)
    yield db
    db.close()

@pytest.mark.asyncio
async def test_gnani_stt_integration_pending_state():
    """Verify that absent credentials explicitly return INTEGRATION_PENDING without simulating false success"""
    # Force blank key to test integration-pending behaviour
    gnani_stt_service.api_key = ""
    res = await gnani_stt_service.transcribe_audio(
        audio_bytes=b"dummy_wav_data",
        language_code="te-IN"
    )
    assert res["is_live_api"] is False
    assert res["status"] == "INTEGRATION_PENDING"
    assert "GNANI_API_KEY" in res["message"]

@pytest.mark.asyncio
async def test_gnani_tts_integration_pending_state():
    """Verify that absent credentials explicitly return INTEGRATION_PENDING for TTS"""
    gnani_tts_service.api_key = ""
    res = await gnani_tts_service.synthesize_speech(
        text="నమస్కారం, కిరాణామిత్ర AI కి స్వాగతం",
        language="te-IN"
    )
    assert res["is_live_api"] is False
    assert res["status"] == "INTEGRATION_PENDING"
    assert "GNANI_API_KEY" in res["message"]

def test_voice_orchestrator_intent_extraction():
    # Test Telugu script intent
    res_te = voice_orchestrator.extract_intent("ఆశీర్వాద్ ఆటా స్టాక్ ఎంత ఉంది?")
    assert res_te["intent"] == "CHECK_ITEM_STOCK"
    assert res_te["sku"] == "SKU-ATTA-01"

    # Test English intent
    res_en = voice_orchestrator.extract_intent("Create a group buy with neighbouring stores for 50 bags of sugar")
    assert res_en["intent"] == "GROUP_BUY_NEGOTIATION"

    # Test Telugu prediction intent
    res_pred = voice_orchestrator.extract_intent("ఈ వారం డిమాండ్ ప్రిడిక్షన్ చూపించు")
    assert res_pred["intent"] == "PREDICT_DEMAND_SHORTAGE"

@pytest.mark.asyncio
async def test_voice_to_agent_to_action_pipeline(db_session):
    # Full pipeline test with Telugu phrase
    result = await voice_orchestrator.process_voice_command(
        db=db_session,
        merchant_id="shop_lakshmi",
        transcript="ఆశీర్వాద్ ఆటా స్టాక్ ఎంత ఉంది?",
        language_code="te-IN"
    )
    assert result["transcription"] == "ఆశీర్వాద్ ఆటా స్టాక్ ఎంత ఉంది?"
    assert result["detected_intent"] == "CHECK_ITEM_STOCK"
    assert len(result["spoken_reply_text"]) > 0
    # Telemetry must contain explicit provider statuses
    assert "provider_status" in result
    assert "gnani_stt" in result["provider_status"]
    assert "gnani_tts" in result["provider_status"]

