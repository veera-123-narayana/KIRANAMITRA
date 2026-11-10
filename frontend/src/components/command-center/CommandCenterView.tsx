"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Coins,
  Layers,
  Mic,
  Network,
  RefreshCw,
  ShieldAlert,
  ShoppingBag,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Merchant,
  NIPSignal,
  CoordinationProposal,
  GovernanceAction,
  DemandPrediction,
} from "@/lib/types";

interface Props {
  merchants: Merchant[];
  signals: NIPSignal[];
  proposals: CoordinationProposal[];
  pendingActions: GovernanceAction[];
  predictions: DemandPrediction[];
  onNavigate: (viewId: any) => void;
  onQuickVoiceSubmit: (transcript: string, lang: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function CommandCenterView({
  merchants,
  signals,
  proposals,
  pendingActions,
  predictions,
  onNavigate,
  onQuickVoiceSubmit,
  onRefresh,
  isRefreshing,
}: Props) {
  const [quickPrompt, setQuickPrompt] = useState("");
  const [selectedLang, setSelectedLang] = useState("te-IN");

  const criticalSignals = signals.filter((s) => s.severity === "CRITICAL" || s.severity === "HIGH");
  const totalSavings = proposals.reduce((acc, p) => acc + (p.projected_savings_inr || 0), 0);

  const samplePrompts = [
    { text: "ఆశీర్వాద్ ఆటా స్టాక్ ఎంత ఉంది?", label: "Telugu: Atta Stock", lang: "te-IN" },
    { text: "సమీప షాపులతో గ్రూప్ బై ఆర్డర్ ప్లాన్ చెయ్యి", label: "Telugu: Group Buy", lang: "te-IN" },
    { text: "Check stock for Toor Dal and supplier quotes", label: "English: Check Dal Quotes", lang: "en-IN" },
    { text: "Show 7-day demand predictions for our store", label: "English: Demand Forecast", lang: "en-IN" },
  ];

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    onQuickVoiceSubmit(quickPrompt, selectedLang);
    setQuickPrompt("");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel-glow border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              Autonomous Intelligence Network &bull; Live Grid
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Neighbourhood Commerce Operations Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Coordinating 3 independent stores across Indiranagar Cluster A. The Neighbourhood Intelligence Protocol (NIP)
            predicts regional deficits, aggregates wholesale purchasing power, and secures volume discounts with human oversight.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/60 text-xs font-mono transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          <span>Sync State</span>
        </button>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl glass-panel border-cyan-500/20 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono">Participating Stores</span>
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{merchants.length} Active</div>
          <div className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1 font-mono">
            <span>Indiranagar Cluster A</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl glass-panel border-cyan-500/20 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono">NIP Network Signals</span>
            <Network className="w-4 h-4 text-electric-sky" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{signals.length} Signals</div>
          <div className="text-[11px] text-amber-400 mt-1 flex items-center gap-1 font-mono">
            <span>{criticalSignals.length} Urgent Shortages</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl glass-panel border-cyan-500/20 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono">Collective Savings</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            ₹{totalSavings.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            <span>via NIP Group Bargaining</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl glass-panel border-cyan-500/20 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono">Human Approval Queue</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {pendingActions.length} Pending
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            <span>Zero Autonomous Outflow</span>
          </div>
        </div>
      </div>

      {/* Critical Shortage Warning Banner */}
      {criticalSignals.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 border border-rose-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-300 font-mono uppercase tracking-wider">
                  NIP Supply Alert &bull; Critical Deficit Detected
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 border border-rose-500/30 font-mono">
                  {criticalSignals[0].commodity}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Cluster inventory depleted. {criticalSignals[0].anonymized_payload?.impacted_stores || 3} stores at risk of stockout within 24 hours.
                Negotiation Agent has prepared an aggregated group buy proposal with Metro Wholesale Hub.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate("negotiation_center")}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg transition-all"
          >
            <span>Review Group Buy</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Voice Command Bar + Active Proposals & Agent Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Fast Voice Dispatcher + Sample Queries */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Voice / Text Command Bar */}
          <div className="p-5 rounded-2xl glass-panel border-cyan-500/25 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Multilingual Voice Dispatcher</h3>
                  <p className="text-[11px] text-slate-400">
                    Telugu, Indian English, and Code-Mixed voice orchestration via Gnani Prisma & Timbre
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLang("te-IN")}
                  className={`text-xs px-2.5 py-1 rounded-lg font-mono font-medium border transition-all ${
                    selectedLang === "te-IN"
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                      : "bg-slate-900 text-slate-400 border-slate-700"
                  }`}
                >
                  తెలుగు (te-IN)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLang("en-IN")}
                  className={`text-xs px-2.5 py-1 rounded-lg font-mono font-medium border transition-all ${
                    selectedLang === "en-IN"
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                      : "bg-slate-900 text-slate-400 border-slate-700"
                  }`}
                >
                  English (en-IN)
                </button>
              </div>
            </div>

            <form onSubmit={handlePromptSubmit} className="flex gap-2">
              <input
                type="text"
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                placeholder={
                  selectedLang === "te-IN"
                    ? "ఉదాహరణ: 'ఆశీర్వాద్ ఆటా స్టాక్ ఎంత ఉంది?' లేదా 'సప్లయర్ రేటు చెక్ చెయ్యి'..."
                    : "e.g. 'Check stock for Atta', 'Plan collective bulk order', 'Forecast demand'..."
                }
                className="flex-1 bg-slate-950/80 border border-cyan-500/30 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-mono"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-glow-cyan transition-all flex items-center gap-2"
              >
                <span>Dispatch</span>
                <Zap className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Sample Query Chips */}
            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-2">Sample Voice Intent Tests:</div>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuickPrompt(s.text);
                      setSelectedLang(s.lang);
                    }}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 font-mono transition-all text-left"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Coordination Proposals */}
          <div className="p-5 rounded-2xl glass-panel border-cyan-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200">Active NIP Group Buy Proposals</h3>
              </div>
              <button
                onClick={() => onNavigate("negotiation_center")}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono"
              >
                <span>Negotiation Center</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {proposals.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{p.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30">
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 font-mono">
                      <span>Supplier: {p.target_supplier_name}</span>
                      <span>&bull;</span>
                      <span>Qty: {p.collective_target_qty} units</span>
                      <span>&bull;</span>
                      <span className="text-emerald-400">Savings: ₹{p.projected_savings_inr} ({p.projected_savings_pct}%)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate("trust_audit")}
                    className="self-start md:self-auto px-3.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 text-xs font-mono transition-all"
                  >
                    Inspect in Queue
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Store Profiles & Human Approval Highlights */}
        <div className="space-y-6">
          {/* Participating Kirana Stores */}
          <div className="p-5 rounded-2xl glass-panel border-cyan-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200">Indiranagar Stores (3)</h3>
              <button
                onClick={() => onNavigate("digital_twin")}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono"
              >
                <span>3D Twin</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {merchants.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/30 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-200">{m.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {m.owner_name} &bull; {m.address.split(",")[0]}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      m.operating_status === "STOCKOUT_RISK"
                        ? "bg-rose-950/60 text-rose-300 border-rose-500/30"
                        : m.operating_status === "WARNING"
                        ? "bg-amber-950/60 text-amber-300 border-amber-500/30"
                        : "bg-emerald-950/60 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {m.operating_status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Approval Widget */}
          <div className="p-5 rounded-2xl glass-panel-violet border-violet-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-bold text-slate-100">Governance Gateway</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950/60 text-violet-300 border border-violet-500/30">
                Gatekeeper
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Autonomous financial checkout is strictly blocked. Human merchant signature is mandatory
              before any supplier payment or lateral stock consignment is authorized.
            </p>

            <div className="pt-2">
              <button
                onClick={() => onNavigate("trust_audit")}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-violet transition-all flex items-center justify-center gap-2"
              >
                <span>Open Approval Queue ({pendingActions.length})</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

