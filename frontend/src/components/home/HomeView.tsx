"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Mic,
  MicOff,
  Package,
  ShoppingCart,
  TrendingUp,
  Truck,
  Sparkles,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  Volume2,
  Send,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSettings } from "@/lib/settings/SettingsContext";
import { formatCurrency, formatNumber } from "@/lib/i18n/formatters";
import { NavTab } from "@/components/navigation/OriginOSNav";
import { api } from "@/lib/api";
import { AudioRecorder, playBase64Audio, speakFallbackText } from "@/lib/gnani";
import {
  Merchant,
  NIPSignal,
  CoordinationProposal,
  GovernanceAction,
  DemandPrediction,
  InventoryItem,
  GnaniStatus,
  VoiceCommandResponse,
} from "@/lib/types";

interface Props {
  merchants: Merchant[];
  selectedMerchantId: string;
  signals: NIPSignal[];
  proposals: CoordinationProposal[];
  pendingActions: GovernanceAction[];
  predictions: DemandPrediction[];
  inventory: InventoryItem[];
  gnaniStatus: GnaniStatus | null;
  isRefreshing: boolean;
  onNavigate: (tab: NavTab) => void;
  onRefresh: () => void;
}

type VoiceOrbState = "idle" | "listening" | "processing" | "speaking";

export function HomeView({
  merchants,
  selectedMerchantId,
  signals,
  proposals,
  pendingActions,
  predictions,
  inventory,
  gnaniStatus,
  isRefreshing,
  onNavigate,
  onRefresh,
}: Props) {
  const { language, t } = useLanguage();
  const { settings } = useSettings();

  const [orbState, setOrbState] = useState<VoiceOrbState>("idle");
  const [quickQuery, setQuickQuery] = useState("");
  const [lastVoiceResult, setLastVoiceResult] = useState<{
    query: string;
    reply: string;
    intent: string;
  } | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  const currentMerchant = merchants.find((m) => m.id === selectedMerchantId) || merchants[0];

  // Calculate today's business metrics from actual inventory & burn rates
  const estimatedDailyRevenue = inventory.reduce(
    (sum, item) => sum + item.daily_burn_rate * item.selling_price,
    0
  );
  const lowOrCriticalItems = inventory.filter(
    (i) => i.status === "LOW" || i.status === "CRITICAL"
  );
  const activeOrdersCount = proposals.length + pendingActions.length;

  const currentHour = new Date().getHours();
  const greetingKey =
    currentHour < 12
      ? "home.greetingMorning"
      : currentHour < 17
      ? "home.greetingAfternoon"
      : "home.greetingEvening";

  const resolveVoiceLang = () => {
    if (settings.voiceInputLang === "auto") {
      return language === "en" ? "en-IN" : `${language}-IN`;
    }
    return settings.voiceInputLang;
  };

  const executeVoiceText = async (transcript: string) => {
    setOrbState("processing");
    setVoiceError(null);
    const inputLang = resolveVoiceLang();
    try {
      const res: VoiceCommandResponse = await api.executeVoiceCommand(
        selectedMerchantId,
        transcript,
        inputLang
      );
      setLastVoiceResult({
        query: res.transcription || transcript,
        reply: res.spoken_reply_text,
        intent: res.detected_intent,
      });

      setOrbState("speaking");
      if (res.tts_audio_base64) {
        await playBase64Audio(res.tts_audio_base64);
      } else if (res.spoken_reply_text) {
        await speakFallbackText(
          res.spoken_reply_text,
          settings.voiceOutputLang,
          settings.voiceSpeed
        );
      }
      onRefresh();
    } catch (err: any) {
      setVoiceError(err?.message || t("common.error"));
    } finally {
      setOrbState("idle");
    }
  };

  const handleOrbClick = async () => {
    if (orbState === "processing" || orbState === "speaking") return;

    if (orbState === "listening") {
      setOrbState("processing");
      try {
        const blob = await recorderRef.current?.stop();
        const inputLang = resolveVoiceLang();
        let transcript = "";
        if (blob && blob.size > 0) {
          try {
            const stt = await api.transcribeAudio(blob, inputLang);
            transcript = stt.transcript || "";
          } catch {
            // Fallback sample prompt if Gnani STT key is pending
          }
        }
        if (!transcript) {
          transcript = t("voice.sample1");
        }
        await executeVoiceText(transcript);
      } catch {
        setOrbState("idle");
      }
      return;
    }

    // Start listening
    try {
      setVoiceError(null);
      const rec = new AudioRecorder();
      recorderRef.current = rec;
      await rec.start();
      setOrbState("listening");
    } catch {
      setVoiceError(
        "Microphone unavailable in this browser context. Type your request below or open AI Assistant."
      );
      setOrbState("idle");
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim() || orbState !== "idle") return;
    const q = quickQuery.trim();
    setQuickQuery("");
    executeVoiceText(q);
  };

  const quickActions: Array<{
    id: string;
    labelKey: string;
    icon: any;
    color: string;
    tab: NavTab;
  }> = [
    {
      id: "inv",
      labelKey: "home.addInventory",
      icon: Package,
      color: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400",
      tab: "my_business",
    },
    {
      id: "ord",
      labelKey: "home.createOrder",
      icon: ShoppingCart,
      color: "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400",
      tab: "my_business",
    },
    {
      id: "sales",
      labelKey: "home.viewSales",
      icon: TrendingUp,
      color: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
      tab: "insights",
    },
    {
      id: "sup",
      labelKey: "home.findSupplier",
      icon: Truck,
      color: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
      tab: "local_network",
    },
    {
      id: "ai",
      labelKey: "home.askAi",
      icon: Sparkles,
      color: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400",
      tab: "ai_assistant",
    },
    {
      id: "rep",
      labelKey: "home.viewReports",
      icon: BarChart3,
      color: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400",
      tab: "insights",
    },
  ];

  // Dynamic intelligence cards backed by live state
  const topHighRiskPred = predictions.find((p) => p.shortage_probability >= 0.7);
  const topProposal = proposals[0];

  const orbStatusText =
    orbState === "listening"
      ? t("home.listening")
      : orbState === "processing"
      ? t("home.processing")
      : orbState === "speaking"
      ? t("home.speaking")
      : t("home.tapToSpeak");

  const MotionWrapper = settings.reducedMotion ? "div" : motion.div;

  return (
    <div className="space-y-6">
      {/* Top Hero Row: Welcome & Summary + Voice Assistant Orb */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Welcome & Today's Business Metrics */}
        <MotionWrapper
          {...(!settings.reducedMotion && {
            initial: { opacity: 0, y: 12 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.35 },
          })}
          className="lg:col-span-7 originos-card p-6 md:p-7 flex flex-col justify-between space-y-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{currentMerchant?.name || t("common.appName")}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t(greetingKey)}, {currentMerchant?.owner_name || t("common.storeOwner")}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t("home.welcomeMessage")}
              </p>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
              title={t("common.refresh")}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>

          {/* 4 Soft OriginOS Stat Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t("home.todayRevenue")}
              </div>
              <div className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(Math.round(estimatedDailyRevenue), language)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t("home.totalOrders")}
              </div>
              <div className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mt-1">
                {formatNumber(activeOrdersCount, language)}
              </div>
            </div>

            <button
              onClick={() => onNavigate("my_business")}
              className="text-left p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 hover:scale-[1.02] transition-transform"
            >
              <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                {t("home.pendingOrders")}
              </div>
              <div className="text-lg md:text-xl font-bold text-amber-800 dark:text-amber-200 mt-1">
                {formatNumber(pendingActions.length, language)}
              </div>
            </button>

            <button
              onClick={() => onNavigate("my_business")}
              className="text-left p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/50 hover:scale-[1.02] transition-transform"
            >
              <div className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                {t("home.inventoryAlerts")}
              </div>
              <div className="text-lg md:text-xl font-bold text-rose-800 dark:text-rose-200 mt-1">
                {formatNumber(lowOrCriticalItems.length, language)}
              </div>
            </button>
          </div>
        </MotionWrapper>

        {/* OriginOS Interactive Voice Assistant Orb Widget */}
        <MotionWrapper
          {...(!settings.reducedMotion && {
            initial: { opacity: 0, y: 12 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.35, delay: 0.08 },
          })}
          className="lg:col-span-5 originos-card p-6 flex flex-col items-center justify-between text-center bg-gradient-to-br from-white via-blue-50/40 to-violet-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30"
        >
          <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {t("home.talkToKiranamitra")}
            </span>
            <button
              onClick={() => onNavigate("ai_assistant")}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-medium"
            >
              <span>{t("nav.aiAssistant")}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Central Glowing Soft Orb */}
          <div className="my-5 relative flex flex-col items-center">
            <button
              onClick={handleOrbClick}
              disabled={orbState === "processing" || orbState === "speaking"}
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-originos-float ${
                orbState === "listening"
                  ? "bg-gradient-to-br from-rose-500 to-amber-500 text-white scale-105 originos-voice-pulse"
                  : orbState === "processing"
                  ? "bg-gradient-to-br from-violet-600 to-blue-600 text-white animate-pulse"
                  : orbState === "speaking"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white originos-voice-pulse"
                  : "bg-gradient-to-br from-blue-600 to-violet-600 text-white hover:scale-105"
              }`}
              aria-label={orbStatusText}
            >
              {orbState === "listening" ? (
                <MicOff className="w-9 h-9" />
              ) : orbState === "processing" ? (
                <RefreshCw className="w-9 h-9 animate-spin" />
              ) : orbState === "speaking" ? (
                <Volume2 className="w-9 h-9" />
              ) : (
                <Mic className="w-9 h-9" />
              )}
            </button>

            <div className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {orbStatusText}
            </div>
            {orbState === "listening" && (
              <div className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                {t("home.stopListening")}
              </div>
            )}
          </div>

          {voiceError && (
            <div className="w-full mb-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
              {voiceError}
            </div>
          )}

          {lastVoiceResult && (
            <div className="w-full mb-3 p-3 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1">
              <div className="text-slate-400 truncate">“{lastVoiceResult.query}”</div>
              <div className="text-slate-800 dark:text-slate-100 font-medium line-clamp-2">
                {lastVoiceResult.reply}
              </div>
            </div>
          )}

          {/* Quick Type Prompt */}
          <form onSubmit={handleQuickSubmit} className="w-full flex items-center gap-2">
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder={t("voice.typePlaceholder")}
              className="flex-1 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <button
              type="submit"
              disabled={orbState !== "idle" || !quickQuery.trim()}
              className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors"
              aria-label={t("voice.send")}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </MotionWrapper>
      </div>

      {/* Quick Actions Grid */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 px-1">
          {t("home.quickActions")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {quickActions.map((act, index) => {
            const Icon = act.icon;
            return (
              <MotionWrapper
                key={act.id}
                {...(!settings.reducedMotion && {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.25, delay: index * 0.04 },
                })}
              >
                <button
                  onClick={() => onNavigate(act.tab)}
                  className="w-full originos-card originos-card-hover p-4 flex flex-col items-center justify-center text-center gap-2.5"
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${act.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {t(act.labelKey)}
                  </span>
                </button>
              </MotionWrapper>
            );
          })}
        </div>
      </section>

      {/* Bottom Row: Intelligent Insights + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Intelligence Cards */}
        <div className="lg:col-span-7 originos-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>{t("home.intelligenceTitle")}</span>
            </h2>
            <button
              onClick={() => onNavigate("insights")}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t("home.viewReports")}
            </button>
          </div>

          <div className="space-y-3">
            {/* Insight 1: Stock Warning */}
            <div
              onClick={() => onNavigate("my_business")}
              className="cursor-pointer p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/40 flex items-start gap-3.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            >
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-rose-800 dark:text-rose-200">
                  {topHighRiskPred
                    ? `${topHighRiskPred.item_name} (${Math.round(topHighRiskPred.shortage_probability * 100)}%)`
                    : t("home.inventoryAlerts")}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {topHighRiskPred?.recommended_intervention || t("home.insightStockLow")}
                </p>
              </div>
            </div>

            {/* Insight 2: Sales & Savings */}
            <div
              onClick={() => onNavigate("local_network")}
              className="cursor-pointer p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 flex items-start gap-3.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
            >
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                  {topProposal ? topProposal.title : t("nav.localNetwork")}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {topProposal
                    ? `${formatCurrency(topProposal.projected_savings_inr, language)} (${topProposal.projected_savings_pct}%) — ${t("home.insightSalesUp")}`
                    : t("home.insightSalesUp")}
                </p>
              </div>
            </div>

            {/* Insight 3: Governance Human Approval */}
            <div
              onClick={() => onNavigate("my_business")}
              className="cursor-pointer p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/40 flex items-start gap-3.5 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
            >
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-blue-800 dark:text-blue-200">
                  {t("common.humanApprovalRequired")} ({pendingActions.length})
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {t("home.insightOrdersWaiting")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-5 originos-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{t("home.recentActivity")}</span>
            </h2>
            {gnaniStatus && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                {signals.length} {t("network.signals")}
              </span>
            )}
          </div>

          {pendingActions.length === 0 && signals.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              {t("home.noRecentActivity")}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {pendingActions.slice(0, 3).map((act) => (
                <div
                  key={act.id}
                  onClick={() => onNavigate("my_business")}
                  className="cursor-pointer p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {act.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatCurrency(act.financial_impact_inr, language)}
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    {t("common.pending")}
                  </span>
                </div>
              ))}

              {signals.slice(0, 3).map((sig) => (
                <div
                  key={sig.id}
                  onClick={() => onNavigate("local_network")}
                  className="cursor-pointer p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {sig.commodity}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {sig.signal_type}
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
