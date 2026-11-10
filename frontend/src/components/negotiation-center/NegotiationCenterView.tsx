"use client";

import React, { useState, useEffect } from "react";
import {
  Handshake,
  TrendingDown,
  Layers,
  Building,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Percent,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { CoordinationProposal, Supplier } from "@/lib/types";

interface Props {
  selectedMerchantId: string;
  onNavigateToGovernance: () => void;
}

export function NegotiationCenterView({ selectedMerchantId, onNavigateToGovernance }: Props) {
  const [proposals, setProposals] = useState<CoordinationProposal[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNegotiationData = async () => {
    try {
      const [propsData, supsData] = await Promise.all([
        api.getProposals(),
        api.getSuppliers(),
      ]);
      setProposals(propsData || []);
      setSuppliers(supsData || []);
    } catch (err) {
      console.error("Failed to load negotiation data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNegotiationData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl glass-panel-glow border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Handshake className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              Collective Bargaining & Negotiation Engine
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Multi-Merchant Purchasing Consortium
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Solves the Minimum Order Quantity (MOQ) barrier. By aggregating purchasing volume across independent Kirana stores,
            the Negotiation Agent unlocks wholesale tier pricing usually reserved for hypermarket chains.
          </p>
        </div>

        <button
          onClick={fetchNegotiationData}
          className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 hover:text-cyan-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Offers</span>
        </button>
      </div>

      {/* Active Group Buy Bargaining Deals */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-200">Active Group Buy Proposals</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {proposals.map((p) => {
            const totalPooled = p.collective_target_qty;
            const standardTotal = p.standard_unit_price * totalPooled;
            const negotiatedTotal = p.negotiated_unit_price * totalPooled;

            return (
              <div
                key={p.id}
                className="p-5 rounded-2xl glass-panel border-cyan-500/30 space-y-4 hover:border-cyan-400 transition-all"
              >
                {/* Proposal Title & Supplier */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{p.title}</h4>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      Target Wholesale Hub: <span className="text-cyan-400 font-semibold">{p.target_supplier_name}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                    {p.status}
                  </span>
                </div>

                {/* Price & Savings Comparison Box */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-center">
                  <div>
                    <div className="text-[10px] text-slate-400">Standard Price</div>
                    <div className="text-sm font-bold text-slate-400 line-through mt-0.5">
                      ₹{p.standard_unit_price}/unit
                    </div>
                    <div className="text-[10px] text-slate-500">₹{standardTotal.toLocaleString("en-IN")}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-cyan-400 font-semibold">Negotiated Rate</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">
                      ₹{p.negotiated_unit_price}/unit
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold">₹{negotiatedTotal.toLocaleString("en-IN")}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Total Savings</div>
                    <div className="text-base font-bold text-cyan-300 mt-0.5">
                      ₹{p.projected_savings_inr}
                    </div>
                    <div className="text-[10px] text-cyan-400 font-semibold">{p.projected_savings_pct}% Discount</div>
                  </div>
                </div>

                {/* Participating Merchant Breakdown */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 font-mono flex items-center justify-between">
                    <span>Participating Stores ({p.participating_merchants?.length || 0}):</span>
                    <span className="text-cyan-400">Total Pooled: {totalPooled} units</span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {p.participating_merchants?.map((pm, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono flex items-center justify-between"
                      >
                        <div>
                          <span className="text-white font-semibold">{pm.merchant_name}</span>
                          <span className="text-[10px] text-slate-400 ml-2">({pm.neighbourhood})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-cyan-300 font-bold">{pm.requested_qty} units</span>
                          <span className="text-[10px] text-slate-500 ml-2">Stock: {pm.current_stock}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Governance Dispatch Action */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 font-mono">
                    Requires Human Authorization
                  </div>
                  <button
                    onClick={onNavigateToGovernance}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-glow-cyan transition-all"
                  >
                    <span>Inspect in Governance Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supplier Directory & Wholesale Tier Catalog */}
      <div className="p-5 rounded-2xl glass-panel border-cyan-500/20 space-y-4">
        <h3 className="text-sm font-bold text-slate-200">Wholesale Supplier Catalogues & Volume Tier Brackets</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{sup.name}</h4>
                  <div className="text-xs text-slate-400 font-mono">{sup.category} &bull; {sup.address}</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  {sup.reliability_rating} &starf; Verified
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-mono text-slate-400">Available Quotes & MOQ Tiers:</div>
                {sup.quotes?.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200 font-semibold">{q.item_name}</span>
                      <span className="text-cyan-400 font-bold">Base: ₹{q.unit_price}/unit</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>MOQ: {q.moq} units</span>
                      <span>
                        Tiers:{" "}
                        {q.bulk_tiers?.map((t) => `${t.min_qty}+ units (${t.discount_pct}% off)`).join(" | ") || "Standard"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

