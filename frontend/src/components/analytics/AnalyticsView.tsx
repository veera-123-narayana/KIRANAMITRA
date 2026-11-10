"use client";

import React from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  ShieldAlert,
  Coins,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { InventoryItem, CoordinationProposal } from "@/lib/types";

interface Props {
  inventory: InventoryItem[];
  proposals: CoordinationProposal[];
}

export function AnalyticsView({ inventory, proposals }: Props) {
  // Category stock and burn rate aggregates
  const categoryData = [
    { category: "Staples (Atta, Rice)", currentStock: 28, optimalStock: 120, dailyBurn: 12.5 },
    { category: "Edible Oils (Sunflower)", currentStock: 77, optimalStock: 140, dailyBurn: 14.5 },
    { category: "Pulses (Toor Dal)", currentStock: 48, optimalStock: 110, dailyBurn: 7.5 },
    { category: "Sweeteners (Sugar)", currentStock: 75, optimalStock: 70, dailyBurn: 6.0 },
  ];

  // Savings over pooling volume brackets
  const poolingSavingsData = [
    { volume: "10-30 units", standardCost: 11250, pooledCost: 11250, savings: 0 },
    { volume: "40 units (MOQ)", standardCost: 15000, pooledCost: 14250, savings: 750 },
    { volume: "80 units", standardCost: 30000, pooledCost: 27000, savings: 3000 },
    { volume: "120 units", standardCost: 45000, pooledCost: 38475, savings: 6525 },
    { volume: "150+ units", standardCost: 56250, pooledCost: 48093, savings: 8157 },
  ];

  // 7-day Demand trajectory forecast
  const demandTrajectoryData = [
    { day: "Mon", baseline: 24, festiveSurge: 24, clusterStock: 110 },
    { day: "Tue", baseline: 26, festiveSurge: 28, clusterStock: 82 },
    { day: "Wed", baseline: 25, festiveSurge: 34, clusterStock: 48 },
    { day: "Thu (Eve)", baseline: 28, festiveSurge: 46, clusterStock: 22 },
    { day: "Fri (Festival)", baseline: 32, festiveSurge: 60, clusterStock: 4 },
    { day: "Sat", baseline: 30, festiveSurge: 52, clusterStock: 85 }, // Restocked
    { day: "Sun", baseline: 28, festiveSurge: 44, clusterStock: 120 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl glass-panel-glow border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              Commercial Analytics & Economics Engine
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Neighbourhood Commerce Economics & Resilience Metrics
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Empirical telemetry on stockout risk mitigation, volume discount capture, and local supply chain buffering.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono text-slate-400">Consolidated Margin Uplift</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">+12.4% Net Margin</div>
          <span className="text-[10px] text-cyan-400 font-mono">via Collective Procurement</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Collective Group Buy Savings Curve */}
        <div className="p-5 rounded-2xl glass-panel border-cyan-500/25 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Wholesale Pooling Cost Curve (INR)</h3>
              <p className="text-[11px] text-slate-400 font-mono">Standard Individual vs Negotiated Group Buy</p>
            </div>
            <span className="text-xs font-mono text-emerald-400">Up to 14.5% Off</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={poolingSavingsData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStandard" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPooled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="volume" stroke="#64748b" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0b1120", borderColor: "#00f0ff", borderRadius: 8, fontSize: 11 }}
                  itemStyle={{ color: "#f1f5f9" }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Area type="monotone" dataKey="standardCost" name="Single Store Cost" stroke="#f43f5e" fillOpacity={1} fill="url(#colorStandard)" />
                <Area type="monotone" dataKey="pooledCost" name="NIP Pooled Cost" stroke="#00f0ff" fillOpacity={1} fill="url(#colorPooled)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: 7-Day Festival Surge vs Depletion Trajectory */}
        <div className="p-5 rounded-2xl glass-panel border-cyan-500/25 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">7-Day Demand Trajectory & Stock Depletion</h3>
              <p className="text-[11px] text-slate-400 font-mono">Baseline vs Festival Surge with Restocking</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">Cluster Level</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demandTrajectoryData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0b1120", borderColor: "#38bdf8", borderRadius: 8, fontSize: 11 }}
                  itemStyle={{ color: "#f1f5f9" }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line type="monotone" dataKey="baseline" name="Standard Velocity" stroke="#64748b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="festiveSurge" name="Festive Surge (+65%)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="clusterStock" name="Cluster Stock Level" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Category Inventory Coverage */}
        <div className="p-5 rounded-2xl glass-panel border-cyan-500/25 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Cluster Stock vs Optimal Thresholds</h3>
              <p className="text-[11px] text-slate-400 font-mono">Current Stock vs Reorder Target (Units)</p>
            </div>
            <span className="text-xs font-mono text-purple-300">Category Comparison</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0b1120", borderColor: "#a855f7", borderRadius: 8, fontSize: 11 }}
                  itemStyle={{ color: "#f1f5f9" }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="currentStock" name="Current Stock" fill="#00f0ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="optimalStock" name="Optimal Stock Target" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

