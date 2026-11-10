export interface Merchant {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  address: string;
  neighbourhood: string;
  latitude: number;
  longitude: number;
  operating_status: "ACTIVE" | "WARNING" | "STOCKOUT_RISK";
  nip_participation_level: "FULL" | "ANONYMIZED" | "PAUSED";
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  current_stock: number;
  unit: string;
  reorder_threshold: number;
  optimal_stock: number;
  cost_price: number;
  selling_price: number;
  daily_burn_rate: number;
  predicted_depletion_hours: number;
  status: "HEALTHY" | "LOW" | "CRITICAL" | "SURPLUS";
}

export interface SupplierQuote {
  sku: string;
  item_name: string;
  unit_price: number;
  moq: number;
  bulk_tiers: Array<{ min_qty: number; discount_pct: number }>;
  available_qty: number;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  lead_time_hours: number;
  reliability_rating: number;
  delivery_radius_km: number;
  quotes: SupplierQuote[];
}

export interface NIPSignal {
  id: string;
  origin_merchant_id: string | null;
  signal_type: "SUPPLY_SHORTAGE" | "SURPLUS_SHARING" | "BULK_POOLING_REQUEST" | "PRICE_SPIKE";
  commodity: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  anonymized_payload: Record<string, any>;
  radius_meters: number;
  confidence: number;
  status: "ACTIVE" | "RESOLVED" | "EXPIRED";
  created_at: string;
}

export interface CoordinationProposal {
  id: string;
  title: string;
  item_name: string;
  target_supplier_id: string;
  target_supplier_name: string;
  collective_target_qty: number;
  participating_merchants: Array<{
    merchant_id: string;
    merchant_name: string;
    neighbourhood: string;
    requested_qty: number;
    current_stock: number;
    optimal_stock: number;
  }>;
  standard_unit_price: number;
  negotiated_unit_price: number;
  projected_savings_inr: number;
  projected_savings_pct: number;
  status: "PROPOSED" | "NEGOTIATING" | "READY_FOR_APPROVAL" | "APPROVED" | "REJECTED" | "EXECUTED";
  created_at: string;
}

export interface GovernanceAction {
  id: string;
  action_type: "SUPPLIER_ORDER" | "INVENTORY_TRANSFER" | "PAYMENT_DISBURSEMENT" | "CATALOG_UPDATE";
  title: string;
  description: string;
  initiating_agent: string;
  target_merchant_id: string;
  financial_impact_inr: number;
  risk_assessment: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "EXECUTED" | "REVERSED";
  details_payload: Record<string, any>;
  approved_by: string | null;
  approved_at: string | null;
  audit_hash: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action_id: string | null;
  actor: string;
  event_type: string;
  previous_state: Record<string, any>;
  new_state: Record<string, any>;
  verification_hash: string;
  notes: string | null;
  timestamp: string;
}

export interface DemandPrediction {
  id: string;
  merchant_id: string;
  sku: string;
  item_name: string;
  horizon_days: number;
  predicted_demand: number;
  current_stock: number;
  shortage_probability: number;
  confidence_score: number;
  supporting_evidence: Array<{ factor: string; metric: string; weight: number }>;
  expected_impact: string;
  recommended_intervention: string;
  created_at: string;
}

export interface AgentTopologyItem {
  name: string;
  role: string;
  tier: string;
  status: string;
  capabilities: string[];
}

export interface AgentExecutionLog {
  id: string;
  agent_name: string;
  execution_cycle_id: string;
  input_payload: Record<string, any>;
  output_payload: Record<string, any>;
  status: "SUCCESS" | "WARNING" | "ERROR" | "PENDING_APPROVAL";
  latency_ms: number;
  details: string;
  timestamp: string;
}

export interface GnaniStatus {
  gnani_stt: {
    name: string;
    is_configured: boolean;
    status: string;
    endpoint: string;
    supported_languages: string[];
    instruction: string;
  };
  gnani_tts: {
    name: string;
    is_configured: boolean;
    status: string;
    endpoint: string;
    supported_languages: string[];
    instruction: string;
  };
  gnani_evon: {
    name: string;
    is_configured: boolean;
    status: string;
    endpoint: string;
    model: string;
    instruction: string;
  };
}

export interface VoiceCommandResponse {
  transcription: string;
  detected_intent: string;
  extracted_entities: Record<string, any>;
  orchestration_result: Record<string, any>;
  spoken_reply_text: string;
  tts_audio_base64: string | null;
  provider_status: Record<string, any>;
}

export interface DigitalTwinState {
  cluster_name: string;
  reference_center: { lat: number; lng: number };
  nodes: Array<{
    id: string;
    type: "MERCHANT_STORE" | "SUPPLIER_DEPOT";
    name: string;
    owner?: string;
    phone?: string;
    address: string;
    neighbourhood?: string;
    coords_geo: { lat: number; lng: number };
    coords_3d: { x: number; y: number; z: number };
    operating_status: string;
    metrics: Record<string, any>;
    inventory_summary?: Array<{ name: string; stock: number; unit: string; status: string }>;
  }>;
  routes: Array<{
    id: string;
    origin_node_id: string;
    origin_name: string;
    destination_nodes: string[];
    commodity: string;
    status: string;
    savings_vs_individual: string;
    coordinates_path: Array<{ x: number; y: number; z: number }>;
  }>;
  active_signals_count: number;
  coordination_proposals_count: number;
  cluster_health: string;
}

