import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    owner_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    neighbourhood = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    operating_status = Column(String, default="ACTIVE")  # ACTIVE, WARNING, STOCKOUT_RISK
    nip_participation_level = Column(String, default="FULL")  # FULL, ANONYMIZED, PAUSED
    private_vault_hash = Column(String, default=gen_uuid)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    inventory = relationship("InventoryItem", back_populates="merchant", cascade="all, delete-orphan")
    governance_actions = relationship("GovernanceAction", back_populates="merchant")

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String, primary_key=True, default=gen_uuid)
    merchant_id = Column(String, ForeignKey("merchants.id"), nullable=False)
    sku = Column(String, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # Staples, Edible Oils, Pulses, Dairy, Spices
    current_stock = Column(Float, nullable=False, default=0.0)
    unit = Column(String, nullable=False, default="units")
    reorder_threshold = Column(Float, nullable=False, default=10.0)
    optimal_stock = Column(Float, nullable=False, default=50.0)
    cost_price = Column(Float, nullable=False, default=0.0)
    selling_price = Column(Float, nullable=False, default=0.0)
    daily_burn_rate = Column(Float, default=2.5)
    predicted_depletion_hours = Column(Float, default=72.0)
    status = Column(String, default="HEALTHY")  # HEALTHY, LOW, CRITICAL, SURPLUS
    last_restocked = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    merchant = relationship("Merchant", back_populates="inventory")

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    lead_time_hours = Column(Integer, default=24)
    reliability_rating = Column(Float, default=4.8)
    delivery_radius_km = Column(Float, default=15.0)
    is_active = Column(Boolean, default=True)

    quotes = relationship("SupplierQuote", back_populates="supplier")

class SupplierQuote(Base):
    __tablename__ = "supplier_quotes"

    id = Column(String, primary_key=True, default=gen_uuid)
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=False)
    sku = Column(String, nullable=False)
    item_name = Column(String, nullable=False)
    unit_price = Column(Float, nullable=False)
    moq = Column(Integer, default=10)
    bulk_tiers = Column(JSON, default=list)  # [{"min_qty": 50, "discount_pct": 8.0}, ...]
    available_qty = Column(Integer, default=500)
    valid_until = Column(DateTime, nullable=True)

    supplier = relationship("Supplier", back_populates="quotes")

class NIPSignal(Base):
    """Neighbourhood Intelligence Protocol (NIP) Signals"""
    __tablename__ = "nip_signals"

    id = Column(String, primary_key=True, default=gen_uuid)
    origin_merchant_id = Column(String, nullable=True)  # Anonymized in public bus if configured
    signal_type = Column(String, nullable=False)  # SUPPLY_SHORTAGE, SURPLUS_SHARING, BULK_POOLING_REQUEST, PRICE_SPIKE
    commodity = Column(String, nullable=False)
    severity = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    anonymized_payload = Column(JSON, default=dict)
    radius_meters = Column(Integer, default=2500)
    confidence = Column(Float, default=0.92)
    status = Column(String, default="ACTIVE")  # ACTIVE, RESOLVED, EXPIRED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class CoordinationProposal(Base):
    """Negotiation Agent & NIP Pooling Proposals"""
    __tablename__ = "coordination_proposals"

    id = Column(String, primary_key=True, default=gen_uuid)
    title = Column(String, nullable=False)
    item_name = Column(String, nullable=False)
    target_supplier_id = Column(String, nullable=False)
    target_supplier_name = Column(String, nullable=False)
    collective_target_qty = Column(Float, nullable=False)
    participating_merchants = Column(JSON, default=list)  # [{"merchant_id": "...", "name": "...", "qty": 40}]
    standard_unit_price = Column(Float, nullable=False)
    negotiated_unit_price = Column(Float, nullable=False)
    projected_savings_inr = Column(Float, nullable=False)
    projected_savings_pct = Column(Float, nullable=False)
    status = Column(String, default="PROPOSED")  # PROPOSED, NEGOTIATING, READY_FOR_APPROVAL, APPROVED, REJECTED, EXECUTED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class GovernanceAction(Base):
    """Human-in-the-Loop Action Approval Queue"""
    __tablename__ = "governance_actions"

    id = Column(String, primary_key=True, default=gen_uuid)
    action_type = Column(String, nullable=False)  # SUPPLIER_ORDER, INVENTORY_TRANSFER, PAYMENT_DISBURSEMENT, CATALOG_UPDATE
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    initiating_agent = Column(String, nullable=False)  # e.g. "Negotiation Agent", "Demand Intelligence Agent"
    target_merchant_id = Column(String, ForeignKey("merchants.id"), nullable=False)
    financial_impact_inr = Column(Float, default=0.0)
    risk_assessment = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH
    status = Column(String, default="PENDING_APPROVAL")  # PENDING_APPROVAL, APPROVED, REJECTED, EXECUTED, REVERSED
    details_payload = Column(JSON, default=dict)
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    audit_hash = Column(String, default=gen_uuid)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    merchant = relationship("Merchant", back_populates="governance_actions")
    audit_logs = relationship("AuditLog", back_populates="governance_action")

class AuditLog(Base):
    """Immutable-style audit ledger"""
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    action_id = Column(String, ForeignKey("governance_actions.id"), nullable=True)
    actor = Column(String, nullable=False)  # Agent name or "Merchant Human Operator"
    event_type = Column(String, nullable=False)  # PROPOSED, REVIEWED, APPROVED, REJECTED, REVERSED
    previous_state = Column(JSON, default=dict)
    new_state = Column(JSON, default=dict)
    verification_hash = Column(String, default=gen_uuid)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    governance_action = relationship("GovernanceAction", back_populates="audit_logs")

class DemandPrediction(Base):
    """Predictive Intelligence Engine Data"""
    __tablename__ = "demand_predictions"

    id = Column(String, primary_key=True, default=gen_uuid)
    merchant_id = Column(String, nullable=False)
    sku = Column(String, nullable=False)
    item_name = Column(String, nullable=False)
    horizon_days = Column(Integer, default=7)
    predicted_demand = Column(Float, nullable=False)
    current_stock = Column(Float, nullable=False)
    shortage_probability = Column(Float, nullable=False)  # 0.0 to 1.0
    confidence_score = Column(Float, nullable=False)  # 0.0 to 1.0
    supporting_evidence = Column(JSON, default=list)  # [{"factor": "Diwali Festival surge", "weight": 0.45}, ...]
    expected_impact = Column(String, nullable=False)
    recommended_intervention = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AgentExecutionLog(Base):
    """Structured communication and execution telemetry for all 6 agents"""
    __tablename__ = "agent_execution_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    agent_name = Column(String, nullable=False)
    execution_cycle_id = Column(String, nullable=False)
    input_payload = Column(JSON, default=dict)
    output_payload = Column(JSON, default=dict)
    status = Column(String, default="SUCCESS")  # SUCCESS, WARNING, ERROR, PENDING_APPROVAL
    latency_ms = Column(Integer, default=0)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

