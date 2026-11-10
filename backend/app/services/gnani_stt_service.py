import time
import httpx
from typing import Optional, Dict, Any
from app.config import settings

class GnaniPrismaSTTService:
    """Official Integration Service for Gnani AI Prisma Speech-to-Text (STT)"""

    def __init__(self):
        self.api_key = settings.GNANI_API_KEY
        self.endpoint = settings.GNANI_PRISMA_ENDPOINT
        self.timeout = 30.0

    def is_configured(self) -> bool:
        """Check if official Gnani API credentials are provided"""
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        content_type: str = "audio/wav",
        language_code: str = "te-IN",
        format_type: str = "codemix"
    ) -> Dict[str, Any]:
        """
        Transcribe audio using Gnani AI Prisma v3.0 REST STT API.
        If credentials are not configured, returns an explicit 'integration_pending' response.
        """
        start_time = time.time()

        if not self.is_configured():
            # Mandatory requirement: Never simulate successful Gnani API integration when credentials are missing.
            # Clearly mark integration-pending state.
            return {
                "transcript": "",
                "confidence": 0.0,
                "detected_language": language_code,
                "provider": "gnani_prisma",
                "is_live_api": False,
                "status": "INTEGRATION_PENDING",
                "latency_ms": int((time.time() - start_time) * 1000),
                "message": "Gnani API key (GNANI_API_KEY) not provided. STT service is in INTEGRATION_PENDING mode. Please set GNANI_API_KEY in backend/.env to enable live Vachana API transcription.",
                "raw_response": None
            }

        headers = {
            "X-API-Key-ID": self.api_key.strip()
        }

        # Form data for Gnani Prisma STT v3
        files = {
            "audio_file": (filename, audio_bytes, content_type)
        }
        data = {
            "model": "prisma-v3.0",
            "language_code": language_code if language_code else "indic-auto",
            "format": format_type
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.endpoint,
                    headers=headers,
                    files=files,
                    data=data
                )
                latency_ms = int((time.time() - start_time) * 1000)

                if response.status_code == 200:
                    resp_json = response.json()
                    # Parse standard Gnani response fields
                    # Typical Gnani STT response structure:
                    # {"transcript": "...", "confidence": 0.95, "language": "te-IN", ...}
                    transcript = resp_json.get("transcript") or resp_json.get("text", "")
                    confidence = float(resp_json.get("confidence", 0.92))
                    detected_lang = resp_json.get("language_code") or resp_json.get("language", language_code)

                    return {
                        "transcript": transcript,
                        "confidence": confidence,
                        "detected_language": detected_lang,
                        "provider": "gnani_prisma",
                        "is_live_api": True,
                        "status": "LIVE_SUCCESS",
                        "latency_ms": latency_ms,
                        "message": "Successfully transcribed via Gnani Prisma v3.0 API",
                        "raw_response": resp_json
                    }
                else:
                    return {
                        "transcript": "",
                        "confidence": 0.0,
                        "detected_language": language_code,
                        "provider": "gnani_prisma",
                        "is_live_api": False,
                        "status": "API_ERROR",
                        "latency_ms": latency_ms,
                        "message": f"Gnani Prisma API returned HTTP {response.status_code}: {response.text}",
                        "raw_response": {"status_code": response.status_code, "text": response.text}
                    }

        except httpx.RequestError as exc:
            latency_ms = int((time.time() - start_time) * 1000)
            return {
                "transcript": "",
                "confidence": 0.0,
                "detected_language": language_code,
                "provider": "gnani_prisma",
                "is_live_api": False,
                "status": "NETWORK_ERROR",
                "latency_ms": latency_ms,
                "message": f"Connection error connecting to Gnani Prisma endpoint: {str(exc)}",
                "raw_response": {"error": str(exc)}
            }

gnani_stt_service = GnaniPrismaSTTService()
