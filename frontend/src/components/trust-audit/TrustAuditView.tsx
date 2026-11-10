"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  RotateCcw,
  Hash,
  Clock,
  Coins,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import { GovernanceAction, AuditLog } from "@/lib/types";

interface Props {
  onActionReviewed: () => void;
}

export function TrustAuditView({ onActionReviewed }: Props) {
  const [queue, setQueue] = useState<GovernanceAction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<"QUEUE" | "LEDGER">("QUEUE");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchGovernanceData = async () => {
    try {
      const [queueData, auditData] = await Promise.all([
        api.getApprovalQueue("ALL"),
        api.getAuditTrail(35),
      ]);
      setQueue(queueData || []);
      setAuditLogs(auditData || []);
    } catch (err) {
      console.error("Failed to load governance data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGovernanceData();
  }, []);

  const handleDecision = async (actionId: string, decision: "APPROVE" | "REJECT") => {
    setProcessingId(actionId);
    try {
      await api.reviewAction(actionId, decision, "Human Merchant Operator", reviewNote || undefined);
      setReviewNote("");
      await fetchGovernanceData();
      onActionReviewed();
    } catch (err: any) {
      alert(`Decision failed: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReverse = async (actionId: string) => {
    if (!confirm("Are you sure you want to execute an emergency cryptographic rollback of this transaction?")) return;
    setProcessingId(actionId);
    try {
      await api.reverseAction(actionId);
      await fetchGovernanceData();
      onActionReviewed();
    } catch (err: any) {
      alert(`Reversal failed: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = queue.filter((a) => a.status === "PENDING_APPROVAL").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl glass-panel-glow border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              Governance & Cryptographic Audit Ledger
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Human-in-the-Loop Sovereign Control Room
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Strict Non-Autonomous Execution Policy: No monetary capital, wholesale purchase order, or store consignment
            can execute without verified human signature. Every authorization is cryptographically anchored in the immutable audit trail.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("QUEUE")}
            className={`text-xs px-4 py-2 rounded-lg font-mono font-medium transition-all ${
              activeTab === "QUEUE"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-glow-cyan"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Approval Queue ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab("LEDGER")}
            className={`text-xs px-4 py-2 rounded-lg font-mono font-medium transition-all ${
              activeTab === "LEDGER"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-glow-cyan"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeTab === "QUEUE" ? (
        /* Action Approval Queue */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">
              Quarantined Autonomous Actions Pending Human Signature
            </h3>
            <button
              onClick={fetchGovernanceData}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:underline font-mono"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {queue.length === 0 ? (
            <div className="p-12 rounded-2xl glass-panel text-center text-slate-500 font-mono text-xs">
              No actions currently queued for review. All previous actions processed.
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map((action) => {
                const isPending = action.status === "PENDING_APPROVAL";
                const isApproved = action.status === "APPROVED";
                const isReversed = action.status === "REVERSED";

                return (
                  <div
                    key={action.id}
                    className={`p-5 rounded-2xl glass-panel border transition-all space-y-4 ${
                      isPending
                        ? "border-amber-500/40 bg-gradient-to-br from-amber-950/15 via-slate-950 to-slate-950"
                        : isApproved
                        ? "border-emerald-500/30"
                        : "border-slate-800"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">{action.title}</h4>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                              action.risk_assessment === "HIGH"
                                ? "bg-rose-950 text-rose-300 border-rose-500/40"
                                : action.risk_assessment === "MEDIUM"
                                ? "bg-amber-950 text-amber-300 border-amber-500/40"
                                : "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                            }`}
                          >
                            {action.risk_assessment} RISK
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{action.description}</p>
                      </div>

                      <div className="flex items-center gap-2 text-right">
                        <span
                          className={`text-xs font-mono font-bold px-3 py-1 rounded-xl border ${
                            isPending
                              ? "bg-amber-950/80 text-amber-300 border-amber-500/50 animate-pulse"
                              : isApproved
                              ? "bg-emerald-950 text-emerald-400 border-emerald-500/50"
                              : isReversed
                              ? "bg-purple-950 text-purple-300 border-purple-500/50"
                              : "bg-slate-900 text-slate-400 border-slate-700"
                          }`}
                        >
                          {action.status}
                        </span>
                      </div>
                    </div>

                    {/* Financial Impact & Audit Parameters */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500">Initiating Agent</div>
                        <div className="text-slate-200 font-semibold mt-0.5">{action.initiating_agent}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Action Type</div>
                        <div className="text-cyan-400 font-semibold mt-0.5">{action.action_type}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Financial Outflow</div>
                        <div className="text-emerald-400 font-bold mt-0.5">
                          ₹{action.financial_impact_inr.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Audit Hash</div>
                        <div className="text-slate-400 truncate mt-0.5" title={action.audit_hash}>
                          {action.audit_hash.slice(0, 14)}...
                        </div>
                      </div>
                    </div>

                    {/* Details Payload Inspector */}
                    {action.details_payload && Object.keys(action.details_payload).length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-300">
                        <span className="text-slate-500 block mb-1">Contract Parameters:</span>
                        <pre className="text-cyan-300 overflow-x-auto">
                          {JSON.stringify(action.details_payload, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Human Action Buttons */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Queued at {new Date(action.created_at).toLocaleTimeString()}</span>
                        {action.approved_by && (
                          <span className="text-emerald-400 ml-2">&bull; Authorized by {action.approved_by}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleDecision(action.id, "REJECT")}
                              disabled={processingId === action.id}
                              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                            >
                              <X className="w-4 h-4 text-rose-400" />
                              <span>Reject</span>
                            </button>

                            <button
                              onClick={() => handleDecision(action.id, "APPROVE")}
                              disabled={processingId === action.id}
                              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-mono font-bold shadow-lg transition-all flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4 text-slate-950" />
                              <span>Sign & Authorize (Human)</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            onClick={() => handleReverse(action.id)}
                            disabled={processingId === action.id}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-purple-950 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                            <span>Rollback / Reverse Transaction</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Immutable Cryptographic Audit Ledger */
        <div className="p-5 rounded-2xl glass-panel border-cyan-500/25 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200">
                Cryptographic Audit Ledger & Chain of Custody
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
              SHA-256 Hash Chained
            </span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-sans">{log.actor}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                      {log.event_type}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-slate-300 font-sans text-xs">{log.notes}</div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                  <span className="truncate max-w-md text-cyan-400">
                    Hash: {log.verification_hash}
                  </span>
                  <span>ID: {log.id.slice(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

