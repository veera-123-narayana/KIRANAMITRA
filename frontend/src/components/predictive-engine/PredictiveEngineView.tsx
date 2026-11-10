"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  AlertOctagon,
  Percent,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { DemandPrediction } from "@/lib/types";

interface Props {
  selectedMerchantId: string;
}

export function PredictiveEngineView({ selectedMerchantId }: Props) {
  const [predictions, setPredictions] = useState<DemandPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getPredictions(selectedMerchantId);
        setPredictions(data || []);
      } catch (err) {
        console.error("Failed to load predictions", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedMerchantId]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl glass-panel-glow border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              Explainable Predictive Intelligence Engine
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Inventory Shortage Probability & Demand Forecaster
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Forecasts localized Kirana consumption patterns by decomposing 30-day velocity, local festive calendars,
            and supply transit latency. Every forecast provides explicit supporting evidence and quantifiable confidence metrics.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono text-slate-400">Model Verification</div>
          <div className="text-sm font-bold text-emerald-400 font-mono">Statistical Decomposition</div>
          <span className="text-[10px] text-slate-500 font-mono">No Simulated Overfitting</span>
        </div>
      </div>

      {/* Predictions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {predictions.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-500 font-mono text-xs">
            No demand predictions generated yet. Run the Demand Intelligence Agent to generate fresh forecasts.
          </div>
        ) : (
          predictions.map((p) => {
            const shortagePct = Math.round(p.shortage_probability * 100);
            const isHighRisk = shortagePct >= 70;
            const confidencePct = Math.round(p.confidence_score * 100);

            return (
              <div
                key={p.id}
                className={`p-5 rounded-2xl glass-panel border transition-all space-y-4 ${
                  isHighRisk
                    ? "border-rose-500/40 bg-gradient-to-br from-rose-950/20 via-slate-950 to-slate-950"
                    : "border-cyan-500/25"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{p.item_name}</h3>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      SKU: {p.sku} &bull; Horizon: {p.horizon_days} Days
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                      isHighRisk
                        ? "bg-rose-950/80 text-rose-300 border-rose-500/50"
                        : "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
                    }`}
                  >
                    {isHighRisk ? "STOCKOUT WARNING" : "STABLE DEMAND"}
                  </span>
                </div>

                {/* Primary Metrics Row */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-center">
                  <div>
                    <div className="text-[10px] text-slate-400">Current Stock</div>
                    <div className="text-base font-bold text-white mt-0.5">{p.current_stock} units</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Projected Demand</div>
                    <div className="text-base font-bold text-cyan-400 mt-0.5">{p.predicted_demand} units</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Shortage Prob.</div>
                    <div
                      className={`text-base font-bold mt-0.5 ${
                        isHighRisk ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {shortagePct}%
                    </div>
                  </div>
                </div>

                {/* Confidence & Evidence Meter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Prediction Confidence Score:</span>
                    <span className="text-cyan-300 font-bold">{confidencePct}% High Fidelity</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full"
                      style={{ width: `${confidencePct}%` }}
                    />
                  </div>
                </div>

                {/* Explainable Supporting Evidence Decomposition */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                    <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Explainable Supporting Evidence:</span>
                  </div>
                  <div className="space-y-1.5">
                    {p.supporting_evidence?.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono flex items-center justify-between"
                      >
                        <span className="text-slate-300">{ev.factor}</span>
                        <span className="text-cyan-400 font-semibold">{ev.metric}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expected Impact & Recommendation */}
                <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/20 space-y-1.5 text-xs font-mono">
                  <div className="text-slate-400">
                    <span className="text-rose-400 font-semibold">Expected Impact:</span> {p.expected_impact}
                  </div>
                  <div className="text-emerald-400 font-semibold">
                    <span className="text-slate-400 font-normal">Recommended Intervention:</span>{" "}
                    {p.recommended_intervention}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

