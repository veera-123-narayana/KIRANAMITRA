import time
import httpx
from typing import Dict, Any, List, Optional
from app.config import settings

class GnaniEvonReasoningService:
    """Service to connect to Gnani Evon Indic Reasoning Model (vLLM / SGLang / OpenAI-compatible endpoint)"""

    def __init__(self):
        self.base_url = settings.GNANI_EVON_BASE_URL.rstrip('/')
        self.api_key = settings.GNANI_EVON_API_KEY
        self.model = settings.GNANI_EVON_MODEL
        self.timeout = 20.0

    def is_configured(self) -> bool:
        return bool(self.base_url and self.base_url != "http://localhost:8000/v1")

    async def reason(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """
        Query Gnani Evon for complex multi-agent reasoning, Telugu parsing, or market negotiation.
        If live Evon server is unavailable, returns structured deterministic domain reasoning
        with clearly marked provider telemetry.
        """
        start_time = time.time()

        if self.is_configured():
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": temperature,
                "max_tokens": 800
            }

            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    latency = int((time.time() - start_time) * 1000)
                    if resp.status_code == 200:
                        data = resp.json()
                        content = data["choices"][0]["message"]["content"]
                        return {
                            "content": content,
                            "provider": "gnani_evon",
                            "is_live_api": True,
                            "latency_ms": latency,
                            "model": self.model,
                            "status": "LIVE_SUCCESS"
                        }
            except Exception as e:
                # Fall through to domain reasoner if live server is unreachable
                pass

        latency = int((time.time() - start_time) * 1000)
        return {
            "content": None,
            "provider": "gnani_evon",
            "is_live_api": False,
            "latency_ms": latency,
            "model": self.model,
            "status": "INTEGRATION_PENDING",
            "message": "Gnani Evon local inference server not detected. Using Kiranamitra Native Multi-Agent Logic Engine."
        }

gnani_evon_service = GnaniEvonReasoningService()

