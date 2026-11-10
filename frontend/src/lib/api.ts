import {
  Merchant,
  InventoryItem,
  Supplier,
  NIPSignal,
  CoordinationProposal,
  GovernanceAction,
  AuditLog,
  DemandPrediction,
  AgentTopologyItem,
  AgentExecutionLog,
  GnaniStatus,
  VoiceCommandResponse,
  DigitalTwinState,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    let errMessage = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      errMessage = err.detail || err.message || errMessage;
    } catch {}
    throw new Error(errMessage);
  }
  return res.json();
}

export const api = {
  // Voice & Gnani AI
  getGnaniStatus: () => fetchJson<GnaniStatus>("/api/voice/status"),
  
  transcribeAudio: async (audioBlob: Blob, languageCode = "te-IN"): Promise<any> => {
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "recording.wav");
    formData.append("language_code", languageCode);
    formData.append("format_type", "codemix");

    const res = await fetch(`${API_BASE}/api/voice/stt`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("STT upload failed");
    return res.json();
  },

  synthesizeSpeech: (text: string, language = "te-IN") =>
    fetchJson<{ audio_base64: string | null; is_live_api: boolean; status: string; message: string }>("/api/voice/tts", {
      method: "POST",
      body: JSON.stringify({ text, language }),
    }),

  executeVoiceCommand: (merchantId: string, transcript: string, language = "te-IN") =>
    fetchJson<VoiceCommandResponse>("/api/voice/command", {
      method: "POST",
      body: JSON.stringify({ merchant_id: merchantId, transcript, language }),
    }),

  // Merchants & Inventory
  getMerchants: () => fetchJson<Merchant[]>("/api/merchants"),
  getMerchant: (id: string) => fetchJson<Merchant>(`/api/merchants/${id}`),
  getMerchantInventory: (id: string) => fetchJson<InventoryItem[]>(`/api/merchants/${id}/inventory`),
  getSuppliers: () => fetchJson<Supplier[]>("/api/merchants/suppliers/all"),
  getPredictions: (merchantId?: string) =>
    fetchJson<DemandPrediction[]>(merchantId ? `/api/merchants/predictions/explainable?merchant_id=${merchantId}` : "/api/merchants/predictions/explainable"),

  // NIP (Neighbourhood Intelligence Protocol)
  getNIPSignals: (commodity?: string) =>
    fetchJson<NIPSignal[]>(commodity ? `/api/nip/signals?commodity=${encodeURIComponent(commodity)}` : "/api/nip/signals"),
  broadcastSignal: (signal: Partial<NIPSignal>) =>
    fetchJson<NIPSignal>("/api/nip/signals", {
      method: "POST",
      body: JSON.stringify(signal),
    }),
  getClusterDisruptions: () => fetchJson<any[]>("/api/nip/disruptions"),
  getOpportunities: () => fetchJson<any[]>("/api/nip/opportunities"),
  getProposals: () => fetchJson<CoordinationProposal[]>("/api/nip/proposals"),

  // Agent Network
  getTopology: () => fetchJson<{ agents: AgentTopologyItem[] }>("/api/agents/topology"),
  getAgentLogs: (limit = 40) => fetchJson<AgentExecutionLog[]>(`/api/agents/logs?limit=${limit}`),
  executeAgent: (payload: { caller_agent: string; action: string; target_merchant_id?: string; payload?: any }) =>
    fetchJson<any>("/api/agents/execute", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Governance & Approvals
  getApprovalQueue: (status = "ALL") =>
    fetchJson<GovernanceAction[]>(`/api/governance/queue?status=${status}`),
  reviewAction: (actionId: string, decision: "APPROVE" | "REJECT", reviewedBy = "Store Owner", reason?: string) =>
    fetchJson<any>("/api/governance/review", {
      method: "POST",
      body: JSON.stringify({ action_id: actionId, decision, reviewed_by: reviewedBy, reason }),
    }),
  reverseAction: (actionId: string) =>
    fetchJson<any>(`/api/governance/reverse/${actionId}`, {
      method: "POST",
    }),
  getAuditTrail: (limit = 40) => fetchJson<AuditLog[]>(`/api/governance/audit-trail?limit=${limit}`),

  // Digital Twin
  getDigitalTwinState: () => fetchJson<DigitalTwinState>("/api/digital-twin/state"),

  // Simulation Lab
  triggerSimulation: (scenario: "SUPPLY_SHOCK" | "FESTIVAL_DEMAND_SURGE" | "PEER_REBALANCE" | "RESET_SIMULATION") =>
    fetchJson<any>("/api/simulation/trigger", {
      method: "POST",
      body: JSON.stringify({ scenario }),
    }),
};
