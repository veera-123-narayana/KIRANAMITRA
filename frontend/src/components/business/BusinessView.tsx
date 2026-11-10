"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  ClipboardCheck,
  Truck,
  CreditCard,
  History,
  Search,
  Check,
  X,
  RotateCcw,
  ShieldCheck,
  Hash,
  Clock,
  RefreshCw,
  Star,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSettings } from "@/lib/settings/SettingsContext";
import { formatCurrency, formatNumber, formatTime } from "@/lib/i18n/formatters";
import { api } from "@/lib/api";
import {
  InventoryItem,
  CoordinationProposal,
  GovernanceAction,
  AuditLog,
  Supplier,
} from "@/lib/types";

interface Props {
  selectedMerchantId: string;
  inventory: InventoryItem[];
  proposals: CoordinationProposal[];
  onRefresh: () => void;
}

type BusinessSubTab = "inventory" | "orders" | "suppliers" | "billing" | "transactions";

export function BusinessView({
  selectedMerchantId,
  inventory,
  proposals,
  onRefresh,
}: Props) {
  const { language, t } = useLanguage();
  const { settings } = useSettings();

  const [subTab, setSubTab] = useState<BusinessSubTab>("inventory");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [queue, setQueue] = useState<GovernanceAction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [loadingSub, setLoadingSub] = useState(false);

  const loadGovernanceAndSuppliers = useCallback(async () => {
    setLoadingSub(true);
    try {
      const [qData, aData, sData] = await Promise.all([
        api.getApprovalQueue("ALL").catch(() => []),
        api.getAuditTrail(35).catch(() => []),
        api.getSuppliers().catch(() => []),
      ]);
      setQueue(qData);
      setAuditLogs(aData);
      setSuppliers(sData);
    } finally {
      setLoadingSub(false);
    }
  }, []);

  useEffect(() => {
    loadGovernanceAndSuppliers();
  }, [loadGovernanceAndSuppliers, selectedMerchantId]);

  const handleDecision = async (actionId: string, decision: "APPROVE" | "REJECT") => {
    setProcessingId(actionId);
    try {
      await api.reviewAction(actionId, decision, t("common.storeOwner"));
      await loadGovernanceAndSuppliers();
      onRefresh();
    } catch (err: any) {
      alert(`${t("common.error")}: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReverse = async (actionId: string) => {
    if (!confirm("Reverse / rollback this transaction?")) return;
    setProcessingId(actionId);
    try {
      await api.reverseAction(actionId);
      await loadGovernanceAndSuppliers();
      onRefresh();
    } catch (err: any) {
      alert(`${t("common.error")}: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingApprovals = queue.filter((a) => a.status === "PENDING_APPROVAL");

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const subTabs: Array<{ id: BusinessSubTab; labelKey: string; icon: any; badge?: number }> = [
    { id: "inventory", labelKey: "business.tabInventory", icon: Package },
    {
      id: "orders",
      labelKey: "business.tabOrders",
      icon: ClipboardCheck,
      badge: pendingApprovals.length,
    },
    { id: "suppliers", labelKey: "business.tabSuppliers", icon: Truck },
    { id: "billing", labelKey: "business.tabBilling", icon: CreditCard },
    { id: "transactions", labelKey: "business.tabTransactions", icon: History },
  ];

  const getStatusBadge = (status: InventoryItem["status"]) => {
    switch (status) {
      case "CRITICAL":
        return {
          label: t("business.statusCritical"),
          cls: "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300",
        };
      case "LOW":
        return {
          label: t("business.statusLow"),
          cls: "bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300",
        };
      case "SURPLUS":
        return {
          label: t("business.statusSurplus"),
          cls: "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300",
        };
      default:
        return {
          label: t("business.statusHealthy"),
          cls: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Sub-Navigation Pills */}
      <div className="originos-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t("business.title")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t("business.subtitle")}
            </p>
          </div>
          <button
            onClick={() => {
              onRefresh();
              loadGovernanceAndSuppliers();
            }}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSub ? "animate-spin" : ""}`} />
            <span>{t("common.refresh")}</span>
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-originos-sm"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t(tab.labelKey)}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBTAB 1: INVENTORY */}
      {subTab === "inventory" && (
        <div className="originos-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("common.search")}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {["ALL", "CRITICAL", "LOW", "HEALTHY", "SURPLUS"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    statusFilter === st
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {st === "ALL"
                    ? t("common.all")
                    : st === "CRITICAL"
                    ? t("business.statusCritical")
                    : st === "LOW"
                    ? t("business.statusLow")
                    : st === "SURPLUS"
                    ? t("business.statusSurplus")
                    : t("business.statusHealthy")}
                </button>
              ))}
            </div>
          </div>

          {filteredInventory.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              {t("business.emptyInventory")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map((item) => {
                const badge = getStatusBadge(item.status);
                const pct = Math.min(
                  100,
                  Math.round((item.current_stock / Math.max(1, item.optimal_stock)) * 100)
                );

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </h3>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.category}
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">
                          {t("business.currentStock")}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {formatNumber(item.current_stock, language)} /{" "}
                          {formatNumber(item.optimal_stock, language)} {item.unit}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.status === "CRITICAL"
                              ? "bg-rose-500"
                              : item.status === "LOW"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                      <div>
                        <div className="text-slate-400 text-[11px]">{t("business.sellingPrice")}</div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          {formatCurrency(item.selling_price, language)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[11px]">{t("business.burnRate")}</div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          {formatNumber(item.daily_burn_rate, language)}/{item.unit}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[11px]">{t("business.depletionHours")}</div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          {Math.round(item.predicted_depletion_hours)}h
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: ORDERS & HUMAN APPROVAL QUEUE (GOVERNANCE) */}
      {subTab === "orders" && (
        <div className="space-y-4">
          <div className="originos-card p-5 bg-gradient-to-r from-blue-50/80 to-violet-50/70 dark:from-slate-900 dark:to-blue-950/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {t("common.humanApprovalRequired")}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {t("settings.privacyDesc")}
              </p>
            </div>
          </div>

          {queue.length === 0 ? (
            <div className="originos-card p-10 text-center text-sm text-slate-400">
              {t("home.noRecentActivity")}
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map((action) => {
                const isPending = action.status === "PENDING_APPROVAL";
                const isApproved = action.status === "APPROVED";
                const isReversed = action.status === "REVERSED";

                return (
                  <div key={action.id} className="originos-card p-5 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {action.title}
                          </h3>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              isPending
                                ? "bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300"
                                : isApproved
                                ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300"
                                : isReversed
                                ? "bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {isPending
                              ? t("common.pending")
                              : isApproved
                              ? t("common.approved")
                              : isReversed
                              ? t("common.reversed")
                              : t("common.rejected")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {action.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          {formatCurrency(action.financial_impact_inr, language)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {action.initiating_agent}
                        </div>
                      </div>
                    </div>

                    {settings.advancedMode && action.details_payload && (
                      <pre className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 overflow-x-auto font-mono">
                        {JSON.stringify(action.details_payload, null, 2)}
                      </pre>
                    )}

                    <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(action.created_at, language)}</span>
                        {action.audit_hash && (
                          <span className="font-mono text-[11px] text-slate-400">
                            #{action.audit_hash.slice(0, 10)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleDecision(action.id, "REJECT")}
                              disabled={processingId === action.id}
                              className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span>{t("common.cancel")}</span>
                            </button>
                            <button
                              onClick={() => handleDecision(action.id, "APPROVE")}
                              disabled={processingId === action.id}
                              className="px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-originos-sm transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              <span>{t("common.confirm")}</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            onClick={() => handleReverse(action.id)}
                            disabled={processingId === action.id}
                            className="px-4 py-2 rounded-2xl bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center gap-1.5 hover:bg-violet-100 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{t("common.reversed")}</span>
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
      )}

      {/* SUBTAB 3: SUPPLIERS */}
      {subTab === "suppliers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {suppliers.map((sup) => (
            <div key={sup.id} className="originos-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {sup.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {sup.category} &bull; {sup.address}
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{sup.reliability_rating}</span>
                </div>
              </div>

              <div className="space-y-2">
                {sup.quotes?.slice(0, 4).map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {q.item_name}
                      </div>
                      <div className="text-slate-400">MOQ: {q.moq}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(q.unit_price, language)}
                      </div>
                      {q.bulk_tiers?.[0] && (
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                          -{q.bulk_tiers[0].discount_pct}% ({q.bulk_tiers[0].min_qty}+)
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 4: BILLING & PAYMENTS */}
      {subTab === "billing" && (
        <div className="originos-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t("business.tabBilling")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <div className="text-xs text-slate-500">{t("common.pending")}</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {formatCurrency(
                  pendingApprovals.reduce((s, a) => s + a.financial_impact_inr, 0),
                  language
                )}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <div className="text-xs text-slate-500">{t("common.approved")}</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {formatCurrency(
                  queue
                    .filter((a) => a.status === "APPROVED" || a.status === "EXECUTED")
                    .reduce((s, a) => s + a.financial_impact_inr, 0),
                  language
                )}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <div className="text-xs text-slate-500">{t("network.groupBuys")}</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {formatCurrency(
                  proposals.reduce((s, p) => s + p.projected_savings_inr, 0),
                  language
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: AUDIT TRANSACTIONS */}
      {subTab === "transactions" && (
        <div className="originos-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-600" />
              <span>{t("business.tabTransactions")}</span>
            </h2>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              SHA-256 Verified
            </span>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {log.actor}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {log.event_type}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatTime(log.timestamp, language)}
                  </span>
                </div>
                {log.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">{log.notes}</p>
                )}
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  {log.verification_hash}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

