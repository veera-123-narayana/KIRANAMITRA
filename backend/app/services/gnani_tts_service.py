import time
import base64
import httpx
from typing import Optional, Dict, Any
from app.config import settings

class GnaniTimbreTTSService:
    """Official Integration Service for Gnani AI Timbre Text-to-Speech (TTS)"""

    def __init__(self):
        self.api_key = settings.GNANI_API_KEY
        self.endpoint = settings.GNANI_TIMBRE_ENDPOINT
        self.timeout = 30.0

    def is_configured(self) -> bool:
        """Check if official Gnani API credentials are provided"""
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    async def synthesize_speech(
        self,
        text: str,
        language: str = "te-IN",
        voice: Optional[str] = None,
        speed: float = 1.0
    ) -> Dict[str, Any]:
        """
        Synthesize text to speech using Gnani AI Timbre v2.5 / v3.0 REST API.
        If credentials are not configured, returns an explicit 'INTEGRATION_PENDING' response.
        """
        start_time = time.time()

        if not self.is_configured():
            return {
                "audio_base64": None,
                "audio_url": None,
                "content_type": "audio/wav",
                "provider": "gnani_timbre",
                "is_live_api": False,
                "status": "INTEGRATION_PENDING",
                "latency_ms": int((time.time() - start_time) * 1000),
                "message": "Gnani API key (GNANI_API_KEY) not provided. TTS service is in INTEGRATION_PENDING mode. Set GNANI_API_KEY in backend/.env for live Timbre voice synthesis.",
                "fallback_text": text,
                "language": language
            }

        headers = {
            "Content-Type": "application/json",
            "X-API-Key-ID": self.api_key.strip()
        }

        # Select default voice based on language
        selected_voice = voice or ("Nalini" if language.startswith("te") else "Pooja")

        payload = {
            "text": text,
            "voice": selected_voice,
            "model": "timbre-v2.5",
            "language": language,
            "speed": speed,
            "audio_config": {
                "encoding": "linear_pcm",
                "container": "wav",
                "num_channels": 1,
                "sample_rate": 24000,
                "sample_width": 2
            }
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.endpoint,
                    headers=headers,
                    json=payload
                )
                latency_ms = int((time.time() - start_time) * 1000)

                if response.status_code == 200:
                    # Gnani TTS can return raw audio bytes or JSON with base64 audio
                    content_type = response.headers.get("content-type", "")
                    if "audio" in content_type:
                        audio_b64 = base64.b64encode(response.content).decode("utf-8")
                    else:
                        resp_json = response.json()
                        audio_b64 = resp_json.get("audioContent") or resp_json.get("audio_data") or resp_json.get("audio", "")

                    return {
                        "audio_base64": audio_b64,
                        "audio_url": None,
                        "content_type": "audio/wav",
                        "provider": "gnani_timbre",
                        "is_live_api": True,
                        "status": "LIVE_SUCCESS",
                        "latency_ms": latency_ms,
                        "message": "Successfully synthesized voice via Gnani Timbre API",
                        "language": language,
                        "voice": selected_voice
                    }
                else:
                    return {
                        "audio_base64": None,
                        "audio_url": None,
                        "content_type": "audio/wav",
                        "provider": "gnani_timbre",
                        "is_live_api": False,
                        "status": "API_ERROR",
                        "latency_ms": latency_ms,
                        "message": f"Gnani Timbre API returned HTTP {response.status_code}: {response.text}",
                        "fallback_text": text,
                        "language": language
                    }

        except httpx.RequestError as exc:
            latency_ms = int((time.time() - start_time) * 1000)
            return {
                "audio_base64": None,
                "audio_url": None,
                "content_type": "audio/wav",
                "provider": "gnani_timbre",
                "is_live_api": False,
                "status": "NETWORK_ERROR",
                "latency_ms": latency_ms,
                "message": f"Network error contacting Gnani Timbre endpoint: {str(exc)}",
                "fallback_text": text,
                "language": language
            }

gnani_tts_service = GnaniTimbreTTSService()

