import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database import engine, Base
from app.models import (
    Merchant,
    InventoryItem,
    Supplier,
    SupplierQuote,
    NIPSignal,
    CoordinationProposal,
    GovernanceAction,
    AuditLog,
    DemandPrediction
)

def init_db():
    Base.metadata.create_all(bind=engine)

def seed_database(db: Session):
    # Check if already seeded
    if db.query(Merchant).count() > 0:
        return

    # 1. Seed 3 Simulated Kirana Shops
    shop1 = Merchant(
        id="shop_lakshmi",
        name="Lakshmi General Store",
        owner_name="Ramesh Babu",
        phone="+91 98450 12345",
        address="Shop 4, 12th Main Road, Indiranagar, Bengaluru",
        neighbourhood="Indiranagar Cluster A",
        latitude=12.9716,
        longitude=77.6412,
        operating_status="STOCKOUT_RISK",
        nip_participation_level="FULL"
    )

    shop2 = Merchant(
        id="shop_venkateshwara",
        name="Sri Venkateshwara Traders",
        owner_name="Srinivasa Rao",
        phone="+91 98450 67890",
        address="88, 100 Feet Road, Indiranagar, Bengaluru",
        neighbourhood="Indiranagar Cluster A",
        latitude=12.9740,
        longitude=77.6445,
        operating_status="WARNING",
        nip_participation_level="FULL"
    )

    shop3 = Merchant(
        id="shop_balaji",
        name="Balaji Kirana & Provisions",
        owner_name="Venkatesh Murthy",
        phone="+91 98450 45678",
        address="14, CMH Road, Indiranagar, Bengaluru",
        neighbourhood="Indiranagar Cluster A",
        latitude=12.9785,
        longitude=77.6390,
        operating_status="ACTIVE",
        nip_participation_level="ANONYMIZED"
    )

    db.add_all([shop1, shop2, shop3])
    db.commit()

    # 2. Seed Suppliers
    sup1 = Supplier(
        id="sup_metro",
        name="Metro Wholesale Hub",
        category="FMCG & Groceries Wholesale",
        address="Depot 2B, Outer Ring Road Logistics Park, Bengaluru",
        latitude=12.9352,
        longitude=77.6946,
        lead_time_hours=18,
        reliability_rating=4.9,
        delivery_radius_km=25.0,
        is_active=True
    )

    sup2 = Supplier(
        id="sup_kisan",
        name="Kisan Direct Agro Mandi",
        category="Grains, Pulses & Oil Depot",
        address="APMC Yard Gate 4, Yeshwanthpur, Bengaluru",
        latitude=13.0280,
        longitude=77.5407,
        lead_time_hours=24,
        reliability_rating=4.7,
        delivery_radius_km=30.0,
        is_active=True
    )

    db.add_all([sup1, sup2])
    db.commit()

    # 3. Seed Supplier Quotes & Bulk Tiers
    quotes = [
        SupplierQuote(
            id="q_atta_metro",
            supplier_id="sup_metro",
            sku="SKU-ATTA-01",
            item_name="Aashirvaad Superior MP Atta 10kg",
            unit_price=375.0,
            moq=40,
            bulk_tiers=[
                {"min_qty": 40, "discount_pct": 5.0},
                {"min_qty": 80, "discount_pct": 10.0},
                {"min_qty": 150, "discount_pct": 14.5}
            ],
            available_qty=800
        ),
        SupplierQuote(
            id="q_oil_metro",
            supplier_id="sup_metro",
            sku="SKU-OIL-01",
            item_name="Fortune Sunlite Sunflower Oil 1L",
            unit_price=128.0,
            moq=60,
            bulk_tiers=[
                {"min_qty": 60, "discount_pct": 6.0},
                {"min_qty": 120, "discount_pct": 12.0}
            ],
            available_qty=1200
        ),
        SupplierQuote(
            id="q_dal_kisan",
            supplier_id="sup_kisan",
            sku="SKU-DAL-01",
            item_name="Tata Sampann Toor Dal 1kg",
            unit_price=152.0,
            moq=50,
            bulk_tiers=[
                {"min_qty": 50, "discount_pct": 7.0},
                {"min_qty": 100, "discount_pct": 12.5}
            ],
            available_qty=650
        ),
        SupplierQuote(
            id="q_sugar_kisan",
            supplier_id="sup_kisan",
            sku="SKU-SUGAR-01",
            item_name="Madhur Pure & Hygienic Sugar 1kg",
            unit_price=42.0,
            moq=100,
            bulk_tiers=[
                {"min_qty": 100, "discount_pct": 5.0},
                {"min_qty": 200, "discount_pct": 9.0}
            ],
            available_qty=2000
        ),
        SupplierQuote(
            id="q_rice_metro",
            supplier_id="sup_metro",
            sku="SKU-RICE-01",
            item_name="India Gate Basmati Rice 5kg",
            unit_price=420.0,
            moq=30,
            bulk_tiers=[
                {"min_qty": 30, "discount_pct": 8.0},
                {"min_qty": 70, "discount_pct": 13.0}
            ],
            available_qty=400
        )
    ]
    db.add_all(quotes)
    db.commit()

    # 4. Seed Inventory for each of the 3 Kirana Stores
    # Shop 1 (Lakshmi General Store) - Experiencing acute Atta & Oil shortages
    inventory_shop1 = [
        InventoryItem(
            merchant_id="shop_lakshmi",
            sku="SKU-ATTA-01",
            name="Aashirvaad Superior MP Atta 10kg",
            category="Staples",
            current_stock=4.0,  # CRITICAL
            unit="bags",
            reorder_threshold=15.0,
            optimal_stock=50.0,
            cost_price=375.0,
            selling_price=420.0,
            daily_burn_rate=5.5,
            predicted_depletion_hours=17.5,
            status="CRITICAL"
        ),
        InventoryItem(
            merchant_id="shop_lakshmi",
            sku="SKU-OIL-01",
            name="Fortune Sunlite Sunflower Oil 1L",
            category="Edible Oils",
            current_stock=12.0,  # LOW
            unit="packets",
            reorder_threshold=25.0,
            optimal_stock=80.0,
            cost_price=128.0,
            selling_price=145.0,
            daily_burn_rate=8.0,
            predicted_depletion_hours=36.0,
            status="LOW"
        ),
        InventoryItem(
            merchant_id="shop_lakshmi",
            sku="SKU-DAL-01",
            name="Tata Sampann Toor Dal 1kg",
            category="Pulses",
            current_stock=38.0,
            unit="packets",
            reorder_threshold=20.0,
            optimal_stock=60.0,
            cost_price=152.0,
            selling_price=175.0,
            daily_burn_rate=3.0,
            predicted_depletion_hours=304.0,
            status="HEALTHY"
        ),
        InventoryItem(
            merchant_id="shop_lakshmi",
            sku="SKU-SUGAR-01",
            name="Madhur Pure & Hygienic Sugar 1kg",
            category="Staples",
            current_stock=75.0,
            unit="packets",
            reorder_threshold=30.0,
            optimal_stock=70.0,
            cost_price=42.0,
            selling_price=48.0,
            daily_burn_rate=6.0,
            predicted_depletion_hours=300.0,
            status="SURPLUS"
        )
    ]

    # Shop 2 (Sri Venkateshwara Traders) - Low Atta, healthy Oil, low Toor Dal
    inventory_shop2 = [
        InventoryItem(
            merchant_id="shop_venkateshwara",
            sku="SKU-ATTA-01",
            name="Aashirvaad Superior MP Atta 10kg",
            category="Staples",
            current_stock=8.0,  # LOW
            unit="bags",
            reorder_threshold=15.0,
            optimal_stock=45.0,
            cost_price=375.0,
            selling_price=420.0,
            daily_burn_rate=4.0,
            predicted_depletion_hours=48.0,
            status="LOW"
        ),
        InventoryItem(
            merchant_id="shop_venkateshwara",
            sku="SKU-OIL-01",
            name="Fortune Sunlite Sunflower Oil 1L",
            category="Edible Oils",
            current_stock=65.0,
            unit="packets",
            reorder_threshold=25.0,
            optimal_stock=70.0,
            cost_price=128.0,
            selling_price=145.0,
            daily_burn_rate=6.5,
            predicted_depletion_hours=240.0,
            status="HEALTHY"
        ),
        InventoryItem(
            merchant_id="shop_venkateshwara",
            sku="SKU-DAL-01",
            name="Tata Sampann Toor Dal 1kg",
            category="Pulses",
            current_stock=10.0,  # LOW
            unit="packets",
            reorder_threshold=20.0,
            optimal_stock=50.0,
            cost_price=152.0,
            selling_price=175.0,
            daily_burn_rate=4.5,
            predicted_depletion_hours=53.0,
            status="LOW"
        )
    ]

    # Shop 3 (Balaji Kirana) - Needs Atta, Surplus Oil
    inventory_shop3 = [
        InventoryItem(
            merchant_id="shop_balaji",
            sku="SKU-ATTA-01",
            name="Aashirvaad Superior MP Atta 10kg",
            category="Staples",
            current_stock=6.0,  # LOW
            unit="bags",
            reorder_threshold=15.0,
            optimal_stock=40.0,
            cost_price=375.0,
            selling_price=420.0,
            daily_burn_rate=3.5,
            predicted_depletion_hours=41.0,
            status="LOW"
        ),
        InventoryItem(
            merchant_id="shop_balaji",
            sku="SKU-OIL-01",
            name="Fortune Sunlite Sunflower Oil 1L",
            category="Edible Oils",
            current_stock=110.0,  # SURPLUS
            unit="packets",
            reorder_threshold=25.0,
            optimal_stock=60.0,
            cost_price=128.0,
            selling_price=145.0,
            daily_burn_rate=5.0,
            predicted_depletion_hours=528.0,
            status="SURPLUS"
        ),
        InventoryItem(
            merchant_id="shop_balaji",
            sku="SKU-RICE-01",
            name="India Gate Basmati Rice 5kg",
            category="Staples",
            current_stock=18.0,
            unit="bags",
            reorder_threshold=10.0,
            optimal_stock=30.0,
            cost_price=420.0,
            selling_price=480.0,
            daily_burn_rate=2.0,
            predicted_depletion_hours=216.0,
            status="HEALTHY"
        )
    ]

    db.add_all(inventory_shop1 + inventory_shop2 + inventory_shop3)
    db.commit()

    # 5. Seed NIP Signals
    sig1 = NIPSignal(
        id="sig_nip_001",
        origin_merchant_id="shop_lakshmi",
        signal_type="SUPPLY_SHORTAGE",
        commodity="Aashirvaad Superior MP Atta 10kg",
        severity="CRITICAL",
        anonymized_payload={
            "cluster": "Indiranagar Cluster A",
            "impacted_stores": 3,
            "collective_deficit_units": 117.0,
            "stockout_timeframe": "24 hours"
        },
        radius_meters=2500,
        confidence=0.96
    )

    sig2 = NIPSignal(
        id="sig_nip_002",
        origin_merchant_id="shop_balaji",
        signal_type="SURPLUS_SHARING",
        commodity="Fortune Sunlite Sunflower Oil 1L",
        severity="LOW",
        anonymized_payload={
            "surplus_units_available": 45.0,
            "lateral_peer_transfer_eligible": True,
            "transfer_window": "Same Day"
        },
        radius_meters=1500,
        confidence=0.92
    )

    db.add_all([sig1, sig2])
    db.commit()

    # 6. Seed a pending Governance Action for human review
    gov_action = GovernanceAction(
        id="gov_action_seed_001",
        action_type="SUPPLIER_ORDER",
        title="NIP Group Buy: 120 Bags Aashirvaad Atta 10kg",
        description="Collective wholesale bulk order with Metro Wholesale Hub securing 10.0% volume discount.",
        initiating_agent="Negotiation Agent",
        target_merchant_id="shop_lakshmi",
        financial_impact_inr=40500.0,
        risk_assessment="HIGH",
        status="PENDING_APPROVAL",
        details_payload={
            "supplier": "Metro Wholesale Hub",
            "commodity": "Aashirvaad Superior MP Atta 10kg",
            "quantity_total": 120,
            "shop_allocations": [
                {"store": "Lakshmi General Store", "allocation": 46, "cost_inr": 15525.0},
                {"store": "Sri Venkateshwara Traders", "allocation": 37, "cost_inr": 12487.5},
                {"store": "Balaji Kirana & Provisions", "allocation": 37, "cost_inr": 12487.5}
            ],
            "standard_cost": 45000.0,
            "negotiated_cost": 40500.0,
            "total_savings_inr": 4500.0
        },
        audit_hash="6d7f9b8c3a1e2d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f"
    )
    db.add(gov_action)

    audit_entry = AuditLog(
        id="audit_log_seed_001",
        action_id=gov_action.id,
        actor="Negotiation Agent -> Trust & Governance Safeguard",
        event_type="ENQUEUED_FOR_APPROVAL",
        previous_state={"status": "PROPOSED"},
        new_state={"status": "PENDING_APPROVAL", "cost": 40500.0},
        verification_hash="6d7f9b8c3a1e2d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
        notes="Autonomous checkout halted by Kiranamitra Governance. Human store owner authorization required."
    )
    db.add(audit_entry)
    db.commit()

    # 7. Seed Demand Predictions
    pred1 = DemandPrediction(
        id="pred_seed_001",
        merchant_id="shop_lakshmi",
        sku="SKU-ATTA-01",
        item_name="Aashirvaad Superior MP Atta 10kg",
        horizon_days=7,
        predicted_demand=48.0,
        current_stock=4.0,
        shortage_probability=0.96,
        confidence_score=0.93,
        supporting_evidence=[
            {"factor": "Diwali Festival Fasting/Feasting Spike", "metric": "+35% seasonal demand uplift", "weight": 0.40},
            {"factor": "Rolling 7-day sales velocity", "metric": "5.5 bags/day", "weight": 0.35},
            {"factor": "Supply depot transit lead time", "metric": "18 hours", "weight": 0.25}
        ],
        expected_impact="High probability of complete stockout within 18 hours. Estimated revenue forfeit: ₹20,160.",
        recommended_intervention="Authorize NIP Group Buy order of 46 bags immediately via Metro Wholesale Hub."
    )
    db.add(pred1)
    db.commit()

