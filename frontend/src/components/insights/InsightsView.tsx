"use client";

import React from "react";
import {
  TrendingUp,
  HelpCircle,
  CheckCircle2,
  AlertOctagon,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSettings } from "@/lib/settings/SettingsContext";
import { formatNumber } from "@/lib/i18n/formatters";
import { DemandPrediction, InventoryItem, CoordinationProposal } from "@/lib/types";

interface Props {
  selectedMerchantId: string;
  predictions: DemandPrediction[];
  inventory: InventoryItem[];
  proposals: CoordinationProposal[];
}

export function InsightsView({
  selectedMerchantId,
  predictions,
  inventory,
  proposals,
}: Props) {
  const { language, t } = useLanguage();
  const { resolvedTheme } = useSettings();

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const tickColor = isDark ? "#94a3b8" : "#64748b";

  const merchantPredictions = predictions.filter(
    (p) => !p.merchant_id || p.merchant_id === selectedMerchantId
  );
  const displayPredictions =
    merchantPredictions.length > 0 ? merchantPredictions : predictions;

  const poolingSavingsData = [
    { volume: "10-30", standardCost: 11250, pooledCost: 11250 },
    { volume: "40", standardCost: 15000, pooledCost: 14250 },
    { volume: "80", standardCost: 30000, pooledCost: 27000 },
    { volume: "120", standardCost: 45000, pooledCost: 38475 },
    { volume: "150+", standardCost: 56250, pooledCost: 48093 },
  ];

  const demandTrajectoryData = [
    { day: "Mon", baseline: 24, festiveSurge: 24, clusterStock: 110 },
    { day: "Tue", baseline: 26, festiveSurge: 28, clusterStock: 82 },
    { day: "Wed", baseline: 25, festiveSurge: 34, clusterStock: 48 },
    { day: "Thu", baseline: 28, festiveSurge: 46, clusterStock: 22 },
    { day: "Fri", baseline: 32, festiveSurge: 60, clusterStock: 4 },
    { day: "Sat", baseline: 30, festiveSurge: 52, clusterStock: 85 },
    { day: "Sun", baseline: 28, festiveSurge: 44, clusterStock: 120 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="originos-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span>{t("insights.title")}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("insights.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{proposals.length} {t("network.groupBuys")} &bull; {inventory.length} SKUs</span>
        </div>
      </div>

      {/* Explainable Predictive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayPredictions.map((p) => {
          const shortagePct = Math.round(p.shortage_probability * 100);
          const confidencePct = Math.round(p.confidence_score * 100);
          const isHighRisk = shortagePct >= 70;

          return (
            <div key={p.id} className="originos-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {p.item_name}
                  </h2>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {p.sku} &bull; {p.horizon_days}d
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                    isHighRisk
                      ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                      : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                  }`}
                >
                  {isHighRisk && <AlertOctagon className="w-3.5 h-3.5" />}
                  <span>{shortagePct}%</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center">
                <div>
                  <div className="text-[11px] text-slate-400">{t("business.currentStock")}</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {formatNumber(p.current_stock, language)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">{t("insights.predictedDemand")}</div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {formatNumber(p.predicted_demand, language)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">{t("insights.shortageProbability")}</div>
                  <div
                    className={`text-sm font-bold mt-0.5 ${
                      isHighRisk ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {shortagePct}%
                  </div>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">{t("insights.confidenceScore")}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {confidencePct}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600"
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
              </div>

              {/* Supporting Evidence */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t("insights.supportingEvidence")}</span>
                </div>
                {p.supporting_evidence?.map((ev, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs flex items-center justify-between"
                  >
                    <span className="text-slate-600 dark:text-slate-300">{ev.factor}</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{ev.metric}</span>
                  </div>
                ))}
              </div>

              {/* Impact & Recommended Intervention */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-xs space-y-1">
                <div className="font-bold text-blue-800 dark:text-blue-200">
                  {t("insights.recommendedIntervention")}
                </div>
                <p className="text-slate-700 dark:text-slate-200">{p.recommended_intervention}</p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  {t("insights.expectedImpact")}: {p.expected_impact}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="originos-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>{t("insights.savingsCurve")}</span>
            </h2>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={poolingSavingsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="stdGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="poolGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="volume" stroke={tickColor} tick={{ fontSize: 11, fill: tickColor }} />
                <YAxis stroke={tickColor} tick={{ fontSize: 11, fill: tickColor }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    borderColor: gridColor,
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="standardCost"
                  name="Single Store Cost"
                  stroke="#ef4444"
                  fill="url(#stdGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="pooledCost"
                  name="NIP Pooled Cost"
                  stroke="#2563eb"
                  fill="url(#poolGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="originos-card p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>{t("insights.demandTrajectory")}</span>
          </h2>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demandTrajectoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="day" stroke={tickColor} tick={{ fontSize: 11, fill: tickColor }} />
                <YAxis stroke={tickColor} tick={{ fontSize: 11, fill: tickColor }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    borderColor: gridColor,
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="baseline" stroke="#64748b" strokeWidth={2} />
                <Line type="monotone" dataKey="festiveSurge" stroke="#f59e0b" strokeWidth={2.5} />
                <Line type="monotone" dataKey="clusterStock" stroke="#10b981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

