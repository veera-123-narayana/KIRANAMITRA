"use client";

import React, { useState, useEffect } from "react";
import {
  Network,
  Shield,
  AlertTriangle,
  RefreshCw,
  Send,
  EyeOff,
  Eye,
  Radio,
  Share2,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { NIPSignal } from "@/lib/types";

interface Props {
  selectedMerchantId: string;
}

export function CollectiveIntelligenceView({ selectedMerchantId }: Props) {
  const [signals, setSignals] = useState<NIPSignal[]>([]);
  const [disruptions, setDisruptions] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [privacyMaskActive, setPrivacyMaskActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // New signal form state
  const [signalType, setSignalType] = useState<string>("SUPPLY_SHORTAGE");
  const [commodity, setCommodity] = useState<string>("Aashirvaad Superior MP Atta 10kg");
  const [severity, setSeverity] = useState<string>("HIGH");
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const [sigs, dis, opps] = await Promise.all([
        api.getNIPSignals(),
        api.getClusterDisruptions(),
        api.getOpportunities(),
      ]);
      setSignals(sigs || []);
      setDisruptions(dis || []);
      setOpportunities(opps || []);
    } catch (err) {
      console.error("Failed to load NIP data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBroadcasting(true);
    try {
      await api.broadcastSignal({
        signal_type: signalType as any,
        commodity,
        severity: severity as any,
        origin_merchant_id: selectedMerchantId,
        anonymized_payload: {
          broadcast_source: "Manual Merchant Signal",
          radius: "Indiranagar Cluster A",
          timestamp: new Date().toISOString(),
        },
        radius_meters: 2500,
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to broadcast signal", err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl glass-panel-glow border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              Neighbourhood Intelligence Protocol (NIP/1.0)
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Collective Commercial Intelligence Bus
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Enables independent Kirana stores to federate demand and anticipate stockouts while enforcing strict privacy
            isolation. Individual customer transactions, profit margins, and supplier invoices remain strictly confidential.
          </p>
        </div>

        {/* Privacy Toggle */}
        <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
          <Shield className="w-4 h-4 text-emerald-400" />
          <div className="text-xs font-mono text-slate-300">
            <span>Store Privacy Shield: </span>
            <span className={privacyMaskActive ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
              {privacyMaskActive ? "ENFORCED" : "UNMASKED"}
            </span>
          </div>
          <button
            onClick={() => setPrivacyMaskActive(!privacyMaskActive)}
            className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-cyan-300"
            title="Toggle anonymized mask preview"
          >
            {privacyMaskActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Cluster Shortages & Lateral Rebalancing Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cluster Disruption Radar */}
        <div className="p-5 rounded-2xl glass-panel border-cyan-500/25 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-slate-200">Cluster Shortage Radar</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30">
              {disruptions.length} Deficits Detected
            </span>
          </div>

          <div className="space-y-3">
            {disruptions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">
                No cluster-wide supply disruptions detected.
              </div>
            ) : (
              disruptions.map((d, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-rose-500/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{d.commodity}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        d.risk_severity === "CRITICAL"
                          ? "bg-rose-950 text-rose-400 border border-rose-500/40"
                          : "bg-amber-950 text-amber-400 border border-amber-500/40"
                      }`}
                    >
                      {d.risk_severity} RISK
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-3">
                    <span>
                      Affected: {d.affected_stores_count} of {d.total_stores_in_cluster} stores
                    </span>
                    <span>&bull;</span>
                    <span className="text-rose-400">Cluster Deficit: {d.cluster_deficit} units</span>
                  </div>
                  <div className="text-xs text-cyan-300 font-mono bg-cyan-950/40 p-2 rounded-lg border border-cyan-500/20">
                    &rarr; {d.opportunity}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lateral Peer-to-Peer Rebalancing */}
        <div className="p-5 rounded-2xl glass-panel border-cyan-500/25 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200">Lateral Store-to-Store Consignments</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
              Instant Rebalance
            </span>
          </div>

          <div className="space-y-3">
            {opportunities.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">
                No lateral rebalance matches found right now.
              </div>
            ) : (
              opportunities.map((opp, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">{opp.item_name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      {opp.transfer_quantity} {opp.unit} Available
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-mono">
                    <span className="text-slate-400">From:</span>{" "}
                    {privacyMaskActive ? "ANON_Indiranagar_Shop_3" : opp.source_merchant} &rarr;{" "}
                    <span className="text-slate-400">To:</span>{" "}
                    {privacyMaskActive ? "ANON_Indiranagar_Shop_1" : opp.destination_merchant}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Speed: {opp.savings_vs_supplier}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Broadcast Signal Form & Live Signal Bus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Form */}
        <div className="lg:col-span-1 p-5 rounded-2xl glass-panel border-cyan-500/25 space-y-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-200">Broadcast Commercial Signal</h3>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Signal Type</label>
              <select
                value={signalType}
                onChange={(e) => setSignalType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="SUPPLY_SHORTAGE">SUPPLY_SHORTAGE (Low Stock Warning)</option>
                <option value="SURPLUS_SHARING">SURPLUS_SHARING (Excess Stock to Share)</option>
                <option value="BULK_POOLING_REQUEST">BULK_POOLING_REQUEST (Group Buy Intent)</option>
                <option value="PRICE_SPIKE">PRICE_SPIKE (Wholesale Price Surge Alert)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Commodity / Item</label>
              <input
                type="text"
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isBroadcasting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-glow-cyan transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isBroadcasting ? "Broadcasting..." : "Broadcast to NIP Bus"}</span>
            </button>
          </form>
        </div>

        {/* Live NIP Bus Feed */}
        <div className="lg:col-span-2 p-5 rounded-2xl glass-panel border-cyan-500/25 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Active NIP Signal Bus ({signals.length})</h3>
            <span className="text-[10px] font-mono text-cyan-400">Zero Private Sales Exposure</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {signals.map((sig) => (
              <div
                key={sig.id}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-sans">{sig.commodity}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded ${
                        sig.severity === "CRITICAL"
                          ? "bg-rose-950 text-rose-400 border border-rose-500/40"
                          : sig.severity === "HIGH"
                          ? "bg-amber-950 text-amber-400 border border-amber-500/40"
                          : "bg-blue-950 text-blue-400 border border-blue-500/40"
                      }`}
                    >
                      {sig.signal_type}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(sig.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Origin:{" "}
                    {privacyMaskActive && sig.origin_merchant_id
                      ? sig.origin_merchant_id.startsWith("ANON")
                        ? sig.origin_merchant_id
                        : `ANON_${sig.origin_merchant_id}`
                      : sig.origin_merchant_id || "ANONYMIZED_CLUSTER_SOURCE"}
                  </span>
                  <span className="text-emerald-400">Confidence: {Math.round(sig.confidence * 100)}%</span>
                  <span>Radius: {sig.radius_meters}m</span>
                </div>

                {sig.anonymized_payload && Object.keys(sig.anonymized_payload).length > 0 && (
                  <div className="p-2 rounded bg-slate-900/60 text-[10px] text-slate-300 font-mono">
                    {JSON.stringify(sig.anonymized_payload)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

