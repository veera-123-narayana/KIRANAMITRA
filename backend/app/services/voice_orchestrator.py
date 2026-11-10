import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.services.gnani_stt_service import gnani_stt_service
from app.services.gnani_tts_service import gnani_tts_service
from app.services.gnani_evon_service import gnani_evon_service
from app.agents.orchestrator_agent import orchestrator_agent
from app.agents.merchant_agent import merchant_agent
from app.agents.demand_agent import demand_agent
from app.agents.supplier_agent import supplier_agent
from app.agents.negotiation_agent import negotiation_agent
from app.agents.governance_agent import governance_agent
from app.schemas.agent_schemas import AgentInput

class VoiceOrchestratorService:
    """
    Voice Orchestrator:
    Orchestrates Voice-to-Agent-to-Action-to-Voice workflow.
    Handles Telugu, English, and Code-Mixed voice transcription via Gnani Prisma,
    extracts structured business intents, drives multi-agent operations,
    and synthesizes natural response speech via Gnani Timbre.
    """

    def __init__(self):
        pass

    def extract_intent(self, text: str, language: str = "te-IN") -> Dict[str, Any]:
        """
        Extracts structured intent and entities from voice transcription.
        Supports Telugu script, transliterated Telugu, and English.
        """
        t = text.lower().strip()

        # Item entities mapping
        detected_item = None
        detected_sku = None
        if "atta" in t or "ఆటా" in t or "aashirvaad" in t or "గోధుమ" in t:
            detected_item = "Aashirvaad Superior MP Atta 10kg"
            detected_sku = "SKU-ATTA-01"
        elif "oil" in t or "నూనె" in t or "sunflower" in t or "సన్‌ఫ్లవర్" in t or "fortune" in t:
            detected_item = "Fortune Sunlite Sunflower Oil 1L"
            detected_sku = "SKU-OIL-01"
        elif "dal" in t or "పప్పు" in t or "toor" in t or "కందిపప్పు" in t or "sampann" in t:
            detected_item = "Tata Sampann Toor Dal 1kg"
            detected_sku = "SKU-DAL-01"
        elif "sugar" in t or "చక్కెర" in t or "పంచదార" in t or "madhur" in t:
            detected_item = "Madhur Pure & Hygienic Sugar 1kg"
            detected_sku = "SKU-SUGAR-01"
        elif "rice" in t or "బియ్యం" in t or "basmati" in t or "ఇండియా గేట్" in t:
            detected_item = "India Gate Basmati Rice 5kg"
            detected_sku = "SKU-RICE-01"

        # Quantity extraction
        qty_match = re.search(r'(\d+)\s*(kg|litres|l|packets|bags|బస్తాలు|ప్యాకెట్లు|కేజీలు|లీటర్లు)?', t)
        detected_qty = float(qty_match.group(1)) if qty_match else 40.0

        # Intent classification
        if any(w in t for w in ["group buy", "pool", "సమూహ", "కలిసి", "collective", "negotiate", "బేరం"]):
            return {
                "intent": "GROUP_BUY_NEGOTIATION",
                "item": detected_item or "Aashirvaad Superior MP Atta 10kg",
                "sku": detected_sku or "SKU-ATTA-01",
                "quantity": detected_qty,
                "confidence": 0.94
            }
        elif any(w in t for w in ["supplier", "quote", "rate", "సప్లయర్", "ధర", "హోల్‌సేల్", "wholesale"]):
            return {
                "intent": "QUERY_SUPPLIER_QUOTES",
                "item": detected_item or "Aashirvaad Superior MP Atta 10kg",
                "sku": detected_sku,
                "quantity": detected_qty,
                "confidence": 0.92
            }
        elif any(w in t for w in ["demand", "forecast", "prediction", "డిమాండ్", "అంచనా", "stockout", "అయిపో"]):
            return {
                "intent": "PREDICT_DEMAND_SHORTAGE",
                "item": detected_item,
                "sku": detected_sku,
                "horizon_days": 7,
                "confidence": 0.93
            }
        elif any(w in t for w in ["health", "status", "పరిస్థితి", "బాగుందా", "warning", "store summary"]):
            return {
                "intent": "CHECK_STORE_HEALTH",
                "confidence": 0.95
            }
        elif any(w in t for w in ["stock", "ఎంత", "how much", "నిల్వ", "చూపించు", "check"]):
            return {
                "intent": "CHECK_ITEM_STOCK",
                "item": detected_item or "Aashirvaad Superior MP Atta 10kg",
                "sku": detected_sku,
                "confidence": 0.96
            }
        else:
            # Default to full end-to-end multi-agent evaluation
            return {
                "intent": "EXECUTE_ORCHESTRATION_PIPELINE",
                "item": detected_item or "Aashirvaad Superior MP Atta 10kg",
                "sku": detected_sku,
                "quantity": detected_qty,
                "confidence": 0.88
            }

    async def process_voice_command(
        self,
        db: Session,
        merchant_id: str,
        transcript: str,
        language_code: str = "te-IN"
    ) -> Dict[str, Any]:
        """
        End-to-End Voice-to-Agent-to-Action workflow.
        Executes intent across agents and prepares Telugu or English response.
        """
        intent_info = self.extract_intent(transcript, language_code)
        intent = intent_info["intent"]
        orchestration_result = {}
        spoken_reply = ""

        is_telugu = language_code.startswith("te")

        if intent == "CHECK_ITEM_STOCK":
            agent_in = AgentInput(
                caller_agent="Voice Orchestrator",
                action="CHECK_ITEM_STOCK",
                target_merchant_id=merchant_id,
                payload={"item_name": intent_info.get("item"), "sku": intent_info.get("sku")}
            )
            out = await merchant_agent.execute(agent_in, db)
            orchestration_result = out.model_dump()
            data = out.data

            if is_telugu:
                if data.get("found"):
                    spoken_reply = (
                        f"{data.get('name')} ప్రస్తుత స్టాక్ {data.get('current_stock')} {data.get('unit')} ఉంది. "
                        f"స్థితి: {data.get('status')}. "
                        + ("స్టాక్ తక్కువగా ఉంది, రీ-ఆర్డర్ అవసరం." if data.get("is_low_stock") else "స్టాక్ సరిపడా ఉంది.")
                    )
                else:
                    spoken_reply = f"క్షమించండి, మీ షాప్‌లో ఈ వస్తువు కనుగొనబడలేదు."
            else:
                spoken_reply = out.summary

        elif intent == "PREDICT_DEMAND_SHORTAGE":
            agent_in = AgentInput(
                caller_agent="Voice Orchestrator",
                action="PREDICT_DEMAND",
                target_merchant_id=merchant_id,
                payload={"sku": intent_info.get("sku"), "horizon_days": 7}
            )
            out = await demand_agent.execute(agent_in, db)
            orchestration_result = out.model_dump()
            alerts = out.data.get("critical_alerts", [])

            if is_telugu:
                if alerts:
                    top = alerts[0]
                    spoken_reply = (
                        f"డిమాండ్ ఇంటెలిజెన్స్ అంచనా ప్రకారం, రాబోయే 7 రోజులలో {top.get('item_name')} "
                        f"స్టాక్‌అవుట్ ప్రమాదం ఉంది. కొరత సంభావ్యత {int(top.get('shortage_probability', 0)*100)}%. "
                        f"వెంటనే సప్లయర్ ద్వారా రీప్లెనిష్ చేయాలని సిఫార్సు చేస్తున్నాము."
                    )
                else:
                    spoken_reply = "రాబోయే 7 రోజులలో స్టాక్ పరిస్థితి సురక్షితంగా ఉంది. తీవ్రమైన కొరత ప్రమాదం ఏమీ లేదు."
            else:
                spoken_reply = out.summary

        elif intent == "QUERY_SUPPLIER_QUOTES":
            agent_in = AgentInput(
                caller_agent="Voice Orchestrator",
                action="GET_PRICE_QUOTES",
                target_merchant_id=merchant_id,
                payload={"item_name": intent_info.get("item"), "sku": intent_info.get("sku"), "required_qty": intent_info.get("quantity", 30.0)}
            )
            out = await supplier_agent.execute(agent_in, db)
            orchestration_result = out.model_dump()
            cheapest = out.data.get("cheapest_option")

            if is_telugu:
                if cheapest:
                    spoken_reply = (
                        f"{cheapest.get('supplier_name')} వద్ద {cheapest.get('item_name')} ధర ఒక యూనిట్‌కు ₹{cheapest.get('effective_unit_price')}. "
                        f"కనీస ఆర్డర్ పరిమాణం (MOQ) {cheapest.get('moq')} యూనిట్లు. డెలివరీ సమయం {cheapest.get('lead_time_hours')} గంటలు."
                    )
                else:
                    spoken_reply = "సప్లయర్ కోట్స్ ఏవీ లభించలేదు."
            else:
                spoken_reply = out.summary

        elif intent in ["GROUP_BUY_NEGOTIATION", "EXECUTE_ORCHESTRATION_PIPELINE"]:
            agent_in = AgentInput(
                caller_agent="Voice Orchestrator",
                action="EXECUTE_END_TO_END_CYCLE",
                target_merchant_id=merchant_id,
                payload={"item_name": intent_info.get("item"), "requested_qty": intent_info.get("quantity", 40.0)}
            )
            out = await orchestrator_agent.execute(agent_in, db)
            orchestration_result = out.model_dump()

            if is_telugu:
                spoken_reply = (
                    f"సమీప దుకాణాలతో కలిసి నైబర్‌హుడ్ గ్రూప్ బై ప్రతిపాదన సిద్ధం చేయబడింది. "
                    f"మొత్తం బల్క్ డిస్కౌంట్ వర్తించింది. ఈ లావాదేవీ మానవ ఆమోదం (Human Approval) కోసం "
                    f"ట్రస్ట్ మరియు గవర్నెన్స్ క్యూలో వేచి ఉంది. దయచేసి సమీక్షించి ఆమోదించండి."
                )
            else:
                spoken_reply = (
                    f"Collective group buy proposal prepared across neighbouring stores. "
                    f"Transaction requires your explicit human approval in the Governance Queue before execution."
                )

        else:
            # Default health
            agent_in = AgentInput(
                caller_agent="Voice Orchestrator",
                action="ASSESS_STORE_HEALTH",
                target_merchant_id=merchant_id
            )
            out = await merchant_agent.execute(agent_in, db)
            orchestration_result = out.model_dump()
            if is_telugu:
                spoken_reply = f"మీ స్టోర్ ఆరోగ్యం: {out.data.get('status')}. మొత్తం {out.data.get('total_skus')} వస్తువులు నిల్వలో ఉన్నాయి."
            else:
                spoken_reply = out.summary

        # Synthesize speech via Gnani Timbre
        tts_result = await gnani_tts_service.synthesize_speech(
            text=spoken_reply,
            language=language_code
        )

        return {
            "transcription": transcript,
            "detected_intent": intent,
            "extracted_entities": intent_info,
            "orchestration_result": orchestration_result,
            "spoken_reply_text": spoken_reply,
            "tts_audio_base64": tts_result.get("audio_base64"),
            "provider_status": {
                "gnani_stt": {
                    "is_live_api": gnani_stt_service.is_configured(),
                    "provider": "Gnani Prisma STT v3.0",
                    "status": "LIVE" if gnani_stt_service.is_configured() else "INTEGRATION_PENDING (Set GNANI_API_KEY)"
                },
                "gnani_tts": {
                    "is_live_api": gnani_tts_service.is_configured(),
                    "provider": "Gnani Timbre TTS v2.5",
                    "status": "LIVE" if gnani_tts_service.is_configured() else "INTEGRATION_PENDING (Set GNANI_API_KEY)"
                },
                "gnani_evon": {
                    "is_live_api": gnani_evon_service.is_configured(),
                    "provider": "Gnani Evon v3.3 Indic Reasoner",
                    "status": "LIVE" if gnani_evon_service.is_configured() else "INTEGRATION_PENDING (Set GNANI_EVON_BASE_URL)"
                }
            }
        }

voice_orchestrator = VoiceOrchestratorService()
