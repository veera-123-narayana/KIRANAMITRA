"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Play,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Terminal,
  Activity,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { AgentTopologyItem, AgentExecutionLog } from "@/lib/types";

interface Props {
  selectedMerchantId: string;
}

export function AgentNetworkView({ selectedMerchantId }: Props) {
  const [topology, setTopology] = useState<AgentTopologyItem[]>([]);
  const [logs, setLogs] = useState<AgentExecutionLog[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("Orchestrator Agent");
  const [selectedAction, setSelectedAction] = useState<string>("EXECUTE_END_TO_END_CYCLE");
  const [executing, setExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchTopologyAndLogs = async () => {
    try {
      const topData = await api.getTopology();
      setTopology(topData.agents || []);
      const logsData = await api.getAgentLogs(25);
      setLogs(logsData || []);
    } catch (err) {
      console.error("Failed to load agent topology", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopologyAndLogs();
    const interval = setInterval(fetchTopologyAndLogs, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleRunAgent = async () => {
    setExecuting(true);
    setExecutionOutput(null);
    try {
      const res = await api.executeAgent({
        caller_agent: selectedAgent,
        action: selectedAction,
        target_merchant_id: selectedMerchantId,
        payload: {
          item_name: "Aashirvaad Superior MP Atta 10kg",
          sku: "SKU-ATTA-01",
          requested_qty: 50.0,
          horizon_days: 7,
        },
      });
      setExecutionOutput(res);
      await fetchTopologyAndLogs();
    } catch (err: any) {
      setExecutionOutput({ error: err.message });
    } finally {
      setExecuting(false);
    }
  };

  const currentAgentObj = topology.find((a) => a.name === selectedAgent) || topology[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 rounded-2xl glass-panel-glow border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              Autonomous Agent Orchestration Architecture
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            6 Specialized Multi-Agent Intelligence Network
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Independent agents communicate through structured typed schemas and database operations.
            Financial transfers and supplier orders are quarantined pending human store operator authorization.
          </p>
        </div>

        <button
          onClick={fetchTopologyAndLogs}
          className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 hover:text-cyan-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Grid of the 6 Autonomous Agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topology.map((agent) => {
          const isSelected = selectedAgent === agent.name;
          return (
            <div
              key={agent.name}
              onClick={() => {
                setSelectedAgent(agent.name);
                if (agent.name === "Merchant Agent") setSelectedAction("CHECK_ITEM_STOCK");
                else if (agent.name === "Demand Intelligence Agent") setSelectedAction("PREDICT_DEMAND");
                else if (agent.name === "Supplier Agent") setSelectedAction("GET_PRICE_QUOTES");
                else if (agent.name === "Negotiation Agent") setSelectedAction("NEGOTIATE_GROUP_BUY");
                else if (agent.name === "Trust and Governance Agent") setSelectedAction("VERIFY_AUDIT_TRAIL");
                else setSelectedAction("EXECUTE_END_TO_END_CYCLE");
              }}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                isSelected
                  ? "bg-slate-900/90 border-cyan-400 border-2 shadow-glow-cyan"
                  : "glass-panel border-slate-800 hover:border-cyan-500/40"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{agent.name}</h4>
                    <span className="text-[10px] text-cyan-400 font-mono">{agent.role}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  ONLINE
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Security Tier:</span>
                  <span className="text-purple-300 text-[10px] px-1.5 py-0.5 rounded bg-purple-950/50 border border-purple-500/20">
                    {agent.tier}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono mb-1">Capabilities:</div>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities?.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Console & Live Message Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive Agent Action Trigger */}
        <div className="p-5 rounded-2xl glass-panel border-cyan-500/25 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200">
                Agent Action Dispatcher: {selectedAgent}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">Direct Execution</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">Target Action</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
              >
                {selectedAgent === "Merchant Agent" && (
                  <>
                    <option value="GET_INVENTORY">GET_INVENTORY (Audit Store Inventory)</option>
                    <option value="CHECK_ITEM_STOCK">CHECK_ITEM_STOCK (Check Aashirvaad Atta)</option>
                    <option value="ASSESS_STORE_HEALTH">ASSESS_STORE_HEALTH (Evaluate Stockout Risk)</option>
                  </>
                )}
                {selectedAgent === "Demand Intelligence Agent" && (
                  <>
                    <option value="PREDICT_DEMAND">PREDICT_DEMAND (7-Day Forecast & Shortage Probability)</option>
                    <option value="ANALYZE_STOCKOUT_RISK">ANALYZE_STOCKOUT_RISK (Depletion Hours)</option>
                    <option value="PROJECT_NEIGHBOURHOOD_DEMAND">PROJECT_NEIGHBOURHOOD_DEMAND (Aggregated Cluster)</option>
                  </>
                )}
                {selectedAgent === "Supplier Agent" && (
                  <>
                    <option value="GET_PRICE_QUOTES">GET_PRICE_QUOTES (Wholesale Quotes & MOQ)</option>
                    <option value="CHECK_BULK_TIERS">CHECK_BULK_TIERS (Tiered Discount Brackets)</option>
                  </>
                )}
                {selectedAgent === "Negotiation Agent" && (
                  <>
                    <option value="NEGOTIATE_GROUP_BUY">NEGOTIATE_GROUP_BUY (Cluster Demand Pooling)</option>
                    <option value="EVALUATE_POOLING_OPPORTUNITY">EVALUATE_POOLING_OPPORTUNITY (Consolidated Savings)</option>
                  </>
                )}
                {selectedAgent === "Trust and Governance Agent" && (
                  <>
                    <option value="VERIFY_AUDIT_TRAIL">VERIFY_AUDIT_TRAIL (Cryptographic Ledger Check)</option>
                    <option value="ENQUEUE_APPROVAL">ENQUEUE_APPROVAL (Simulate Financial Quarantine)</option>
                  </>
                )}
                {selectedAgent === "Orchestrator Agent" && (
                  <>
                    <option value="EXECUTE_END_TO_END_CYCLE">EXECUTE_END_TO_END_CYCLE (Voice to Multi-Agent to Action)</option>
                    <option value="GET_AGENT_TOPOLOGY">GET_AGENT_TOPOLOGY (Poll Agent Mesh Status)</option>
                  </>
                )}
              </select>
            </div>

            <button
              onClick={handleRunAgent}
              disabled={executing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-glow-cyan transition-all flex items-center justify-center gap-2"
            >
              {executing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Executing Agent Logic...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>Trigger {selectedAgent}</span>
                </>
              )}
            </button>
          </div>

          {/* Execution Output JSON Inspector */}
          {executionOutput && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Output Schema Payload:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    executionOutput.status === "SUCCESS"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-950 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {executionOutput.status}
                </span>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 max-h-60 overflow-y-auto leading-relaxed">
                {JSON.stringify(executionOutput, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Right: Real-time Multi-Agent Execution Telemetry Log */}
        <div className="p-5 rounded-2xl glass-panel border-cyan-500/25 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200">Execution Telemetry Stream</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Live Backend Events</span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">
                No telemetry recorded. Trigger an agent to view real-time traces.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-mono space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{log.agent_name}</span>
                    <span className="text-[10px] text-slate-500">
                      {log.latency_ms}ms &bull; {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    {log.details || JSON.stringify(log.output_payload?.summary || "")}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span className="truncate max-w-[200px]">Cycle: {log.execution_cycle_id}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        log.status === "SUCCESS"
                          ? "text-emerald-400 bg-emerald-950/40"
                          : "text-amber-400 bg-amber-950/40"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

