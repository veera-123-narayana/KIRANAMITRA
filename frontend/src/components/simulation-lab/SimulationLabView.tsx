"use client";

import React, { useState } from "react";
import {
  FlaskConical,
  Zap,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Share2,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  onSimulationChanged: () => void;
}

export function SimulationLabView({ onSimulationChanged }: Props) {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const runScenario = async (
    scenario: "SUPPLY_SHOCK" | "FESTIVAL_DEMAND_SURGE" | "PEER_REBALANCE" | "RESET_SIMULATION"
  ) => {
    setActiveScenario(scenario);
    setRunning(true);
    setSimulationResult(null);

    try {
      const res = await api.triggerSimulation(scenario);
      setSimulationResult(res);
      onSimulationChanged();
    } catch (err: any) {
      setSimulationResult({ error: err.message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl glass-panel-glow border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              Stress-Testing & Event Simulation Lab
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Neighbourhood Market Scenario Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulate real-world commerce disruptions: supply chain shocks, festival consumption surges,
            and inter-store lateral inventory sharing. Observe how autonomous agents collaborate under NIP to stabilize the local economy.
          </p>
        </div>

        <button
          onClick={() => runScenario("RESET_SIMULATION")}
          disabled={running}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700 text-xs font-mono transition-all"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${running && activeScenario === "RESET_SIMULATION" ? "animate-spin" : ""}`} />
          <span>Reset Simulation State</span>
        </button>
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Scenario 1: Regional Supply Shock */}
        <div className="p-5 rounded-2xl glass-panel border-rose-500/30 bg-gradient-to-br from-rose-950/20 via-slate-950 to-slate-950 flex flex-col justify-between space-y-4 hover:border-rose-400 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/30">
                SCENARIO A &bull; DISRUPTION
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-base font-bold text-white">Regional Supply Shock (Edible Oil)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Simulates a sudden transit freeze at the regional edible oil packaging depot. Depletes Fortune Sunflower Oil
              across all cluster stores by 75% and broadcasts an urgent NIP shortage signal.
            </p>
          </div>

          <button
            onClick={() => runScenario("SUPPLY_SHOCK")}
            disabled={running}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-white" />
            <span>Trigger Supply Shock</span>
          </button>
        </div>

        {/* Scenario 2: Festival Demand Surge */}
        <div className="p-5 rounded-2xl glass-panel border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-slate-950 to-slate-950 flex flex-col justify-between space-y-4 hover:border-cyan-400 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                SCENARIO B &bull; DEMAND SPIKE
              </span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-white">Diwali Festival Demand Surge (+65%)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Applies a 65% seasonal demand uplift to Staples (Atta, Sugar, Rice). Triggers Demand Intelligence Agent
              forecasting and automatically activates the multi-agent pipeline to form a group buy.
            </p>
          </div>

          <button
            onClick={() => runScenario("FESTIVAL_DEMAND_SURGE")}
            disabled={running}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-glow-cyan transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-slate-950" />
            <span>Simulate Festival Surge</span>
          </button>
        </div>

        {/* Scenario 3: Lateral Peer Consignment Rebalance */}
        <div className="p-5 rounded-2xl glass-panel border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-950 to-slate-950 flex flex-col justify-between space-y-4 hover:border-emerald-400 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                SCENARIO C &bull; REBALANCE
              </span>
              <Share2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white">Lateral Peer Consignment (30 Mins)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Balances stock laterally without waiting 24h wholesale delivery. Dispatches 25 surplus oil packets
              from Balaji Kirana & Provisions to depleted Lakshmi General Store, updating cryptographically signed ledgers.
            </p>
          </div>

          <button
            onClick={() => runScenario("PEER_REBALANCE")}
            disabled={running}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4 text-slate-950" />
            <span>Execute Lateral Consignment</span>
          </button>
        </div>
      </div>

      {/* Real-time Simulation Output Terminal */}
      {simulationResult && (
        <div className="p-5 rounded-2xl glass-panel border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200 font-bold">Scenario Telemetry Delta Output</span>
            </div>
            <span className="text-cyan-400">{simulationResult.scenario}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 leading-relaxed">
            <div className="text-slate-200 font-semibold mb-2">{simulationResult.message}</div>
            <pre className="text-[11px] text-slate-400 overflow-x-auto max-h-60">
              {JSON.stringify(simulationResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

