# KIRANAMITRA AI
### The Autonomous Intelligence Network for Local Commerce
> **Tagline:** *From Individual Shops to an Intelligent, Self-Coordinating Economy.*

---

## 🚀 Overview

**KIRANAMITRA AI** is a multilingual, voice-first, multi-agent AI commerce network engineered to connect independent local retail businesses (*Kirana stores*), wholesale suppliers, and neighbourhood economies through collective intelligence.

This is **NOT** a conventional chatbot, simple inventory spreadsheet, or standard e-commerce store.

The central innovation is the **Neighbourhood Intelligence Protocol (NIP)**: a federated protocol enabling independent, sovereign AI agents to exchange permission-controlled business signals, forecast local supply deficits before consumers experience out-of-stock shelves, evaluate volume consolidation opportunities, and synthesize group procurement proposals that require explicit **human approval** prior to financial execution.

---

## 🏛️ System Architecture

```
                                  +-----------------------------+
                                  |   Multilingual Voice UI     |
                                  |  (Telugu, English, Code-Mix)|
                                  +--------------+--------------+
                                                 |
                         +-----------------------+-----------------------+
                         |                                               |
             [Gnani Prisma STT v3.0]                         [Gnani Timbre TTS v2.5]
                         |                                               ^
                         v                                               |
        +----------------------------------+                             |
        |    Voice Orchestration Engine    |-----------------------------+
        +----------------+-----------------+
                         |
                         v
     ===========================================
     |       6 AUTONOMOUS SPECIALIZED AGENTS   |
     ===========================================
     |  1. Merchant Agent                      | -> Isolated Shop Inventory Vault
     |  2. Demand Intelligence Agent           | -> Explainable Stockout Probability
     |  3. Supplier Agent                      | -> Wholesale MOQ & Catalog Discovery
     |  4. Negotiation Agent                   | -> Cluster Group Buy Bargaining
     |  5. Trust & Governance Agent            | -> Human-in-the-Loop Quarantining
     |  6. Orchestrator Agent                  | -> State Graph & Pipeline Integrity
     ===========================================
                         |
                         v
     ===========================================
     |   NEIGHBOURHOOD INTELLIGENCE PROTOCOL   |
     |                (NIP/1.0)                |
     ===========================================
     | &bull; Privacy-Preserving Signal Bus    | (Zero private ledger leakage)
     | &bull; Systemic Disruption Radar        | (Early warning supply shocks)
     | &bull; Lateral Peer Rebalancing         | (30-min shop-to-shop consignments)
     | &bull; Cryptographic Audit Ledger       | (SHA-256 chain of custody)
     ===========================================
```

---

## 🎙️ Official Gnani AI Integration

KIRANAMITRA AI is integrated with the official **Gnani.ai (Vachana)** speech and language APIs:

1. **Gnani Prisma Speech-to-Text (STT v3.0):**
   - **Endpoint:** `POST https://api.vachana.ai/stt/v3`
   - **Headers:** `X-API-Key-ID: <GNANI_API_KEY>`
   - **Languages:** Telugu (`te-IN`), Indian English (`en-IN`), and Indic auto-detection (`indic-auto`).
   - **Audio Formats:** WAV, MP3, WebM, OGG.
   - **Formats:** `codemix`, `transcribe`, `verbatim`.

2. **Gnani Timbre Text-to-Speech (TTS v2.5):**
   - **Endpoint:** `POST https://api.vachana.ai/api/v1/tts/inference`
   - **Headers:** `X-API-Key-ID: <GNANI_API_KEY>`
   - **Payload:** High-fidelity linear PCM audio synthesis in Telugu and English.

3. **Gnani Evon Indic Reasoning Model:**
   - **Model:** `gnani/gnani-evon-v3.3-30B-A3B` (Mamba2-MoE Indic Architecture)
   - **Interface:** OpenAI-compatible API (`GNANI_EVON_BASE_URL` or local vLLM/SGLang deployment).

### 🛡️ Strict Integration Honesty Policy
Per specification, KIRANAMITRA AI **never simulates false Gnani API connectivity**. 
- When `GNANI_API_KEY` is present in the backend environment, live Vachana REST inference is performed.
- When credentials are not yet set, the UI and API explicitly display an **`INTEGRATION_PENDING`** status badge with instructions on setting `GNANI_API_KEY`, alongside client-side browser speech synthesis fallback so demonstrations never crash.

---

## 🌐 10 Core Application Modules

1. **Command Center:** Real-time neighbourhood commerce hub. Active store roster, live NIP signal ticker, collective savings generated, and quick voice dispatcher.
2. **Voice Intelligence:** Multilingual studio with live microphone recording, waveform visualizer, Prisma transcription, structured intent parser, Timbre audio playback, and pre-configured Telugu/English voice prompts.
3. **Agent Network:** Full topology of all 6 autonomous agents. Displays security tiers, capabilities, structured input/output JSON inspector, and manual agent trigger testbed.
4. **Collective Intelligence (NIP):** The commercial signal bus. Shows cluster shortage radar, lateral store rebalancing consignments, and active group buy proposals while enforcing privacy shielding.
5. **Predictive Engine:** Explainable demand forecasting. Displays 7-day predicted demand, shortage probability gauges, confidence scores, supporting evidence factors, revenue forfeiture risk, and recommended interventions.
6. **Negotiation Center:** Group buy bargaining arena. Compares single-store vs group buy prices, illustrates MOQ volume tier brackets, and calculates collective INR savings.
7. **Digital Twin (3D Grid):** Interactive 3D WebGL neighbourhood grid powered by Three.js. Visualizes shops, supplier depots, stockout halos, and animated logistics routes with an inspectable shop inventory drawer.
8. **Trust and Audit (Governance):** Human-in-the-Loop Sovereign Control Room. Enforces non-autonomous financial transaction policy. Human merchants must review and authorize actions. Features transaction rollback/reversal safeguards and a SHA-256 cryptographic audit ledger.
9. **Simulation Lab:** Stress-testing laboratory. Triggers real-time market scenarios: *Regional Supply Shock (Edible Oil)*, *Festival Demand Surge (+65%)*, *Lateral Peer Consignment (30-min)*, and *State Reset*.
10. **Analytics:** Macro-economic charts built with Recharts: wholesale pooling cost curves, 7-day demand vs depletion curves, and category stock coverage ratios.

---

## 🔒 Privacy & Governance Safeguards

- **Zero Transaction Leakage:** Under NIP, no merchant's private transactions, customer receipts, or profit margins are ever exposed to neighbouring peers. Signals are anonymized and aggregated at the cluster level.
- **No Autonomous Financial Outflow:** Autonomous checkout is strictly disabled. All supplier orders, inventory consignments, and payment disbursements are automatically quarantined in the **Human Approval Queue** requiring merchant signature.
- **Cryptographic Audit Chain:** Every approved, rejected, or reversed transaction is recorded in a SHA-256 hash-chained immutable audit log.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, Framer Motion, Three.js, Recharts, Lucide Icons.
- **Backend:** Python 3.13, FastAPI, SQLAlchemy, SQLite/PostgreSQL, WebSockets, Pydantic v2.
- **AI & Speech:** Gnani AI Prisma STT, Gnani AI Timbre TTS, Gnani Evon Indic LLM, Custom Agent Orchestration Layer.

---

## 🏁 Quick Start Guide

### 1. Clone & Setup Workspace
```bash
cd d:\Gnanai
```

### 2. Configure Backend
```bash
cd backend
# Create environment file
copy .env.example .env
```
Edit `backend/.env` with your Gnani credentials:
```env
GNANI_API_KEY=your_gnani_api_key_here
GNANI_BASE_URL=https://api.vachana.ai
DATABASE_URL=sqlite:///./kiranamitra.db
```

Activate the Python virtual environment and run the backend:
```bash
# Windows
.\venv\Scripts\activate
# Start FastAPI backend (port 8000)
python run.py
```
*The database automatically creates all schema tables and seeds the 3 Indiranagar stores, wholesale suppliers, catalog quotes, and initial NIP signals.*

### 3. Start Frontend
In a new terminal:
```bash
cd frontend
# Start Next.js development server (port 3000)
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Automated Test Suite

Run the full pytest suite verifying the multi-agent architecture, NIP protocol, governance safeguards, and Gnani API services:
```bash
cd backend
.\venv\Scripts\pytest -v
```
All 15 automated test cases validate:
- Merchant Agent stock audits & vault isolation
- Demand Intelligence stockout probability calculations
- Supplier Agent wholesale MOQ & tier calculations
- Negotiation Agent group buy pooling
- Orchestrator Agent end-to-end multi-agent pipelines
- Gnani STT & TTS integration-pending validation
- Voice intent extraction (Telugu & English)
- Trust & Governance financial quarantine & cryptographic audit hashing
- NIP Signal broadcasting & anonymization
- Lateral peer rebalancing opportunities

---

## 🗺️ API Directory

| Endpoint | Method | Description |
|---|---|---|
| `/api/voice/status` | GET | Official Gnani Prisma & Timbre connectivity status |
| `/api/voice/stt` | POST | Transcribe audio via Gnani Prisma v3.0 |
| `/api/voice/tts` | POST | Synthesize speech via Gnani Timbre v2.5 |
| `/api/voice/command` | POST | End-to-end voice intent execution pipeline |
| `/api/agents/topology` | GET | Status and capabilities of all 6 agents |
| `/api/agents/execute` | POST | Dispatch structured action to an agent |
| `/api/agents/logs` | GET | Real-time multi-agent execution telemetry |
| `/api/nip/signals` | GET / POST | Fetch or broadcast NIP commercial signals |
| `/api/nip/disruptions` | GET | Cluster shortage radar analysis |
| `/api/nip/opportunities` | GET | Lateral peer-to-peer rebalancing deals |
| `/api/merchants` | GET | List simulated Kirana stores |
| `/api/merchants/{id}/inventory` | GET | Private store inventory vault |
| `/api/governance/queue` | GET | Human approval action quarantine queue |
| `/api/governance/review` | POST | Human merchant approval or rejection |
| `/api/governance/reverse/{id}` | POST | Emergency transaction rollback |
| `/api/digital-twin/state` | GET | 3D WebGL mesh coordinates and logistics routes |
| `/api/simulation/trigger` | POST | Trigger Supply Shock, Festival Surge, Rebalance |

---

## 👥 Seed Data Simulation
- **Shop 1:** Lakshmi General Store (Ramesh Babu, Indiranagar 12th Main) &mdash; Critical Atta deficit.
- **Shop 2:** Sri Venkateshwara Traders (Srinivasa Rao, 100 Feet Road) &mdash; Low Atta & Toor Dal.
- **Shop 3:** Balaji Kirana & Provisions (Venkatesh Murthy, CMH Road) &mdash; Low Atta, Surplus Sunflower Oil.
- **Supplier 1:** Metro Wholesale Hub (Outer Ring Road Logistics Park).
- **Supplier 2:** Kisan Direct Agro Mandi (APMC Yard Yeshwanthpur).

---

&copy; 2026 KIRANAMITRA AI &bull; Autonomous Intelligence Network for Local Commerce

