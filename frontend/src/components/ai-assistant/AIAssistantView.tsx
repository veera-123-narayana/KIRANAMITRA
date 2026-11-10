"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Bot,
  Send,
  RefreshCw,
  AlertCircle,
  Cpu,
  FlaskConical,
  Play,
  Zap,
  RotateCcw,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSettings } from "@/lib/settings/SettingsContext";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/types";
import { formatTime } from "@/lib/i18n/formatters";
import { api } from "@/lib/api";
import { AudioRecorder, playBase64Audio, speakFallbackText } from "@/lib/gnani";
import {
  GnaniStatus,
  VoiceCommandResponse,
  AgentTopologyItem,
  AgentExecutionLog,
} from "@/lib/types";

interface Props {
  selectedMerchantId: string;
  gnaniStatus: GnaniStatus | null;
  onRefresh: () => void;
}

interface MessageHistoryItem {
  id: string;
  timestamp: string;
  language: string;
  userQuery: string;
  response: VoiceCommandResponse;
}

type AssistantSubView = "voice" | "agents" | "simulation";

export function AIAssistantView({ selectedMerchantId, gnaniStatus, onRefresh }: Props) {
  const { language, t } = useLanguage();
  const { settings, updateSetting } = useSettings();

  const [subView, setSubView] = useState<AssistantSubView>("voice");
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<MessageHistoryItem[]>([]);
  const [recorderError, setRecorderError] = useState<string | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  // Agent Network state (for Advanced Mode / Agents tab)
  const [topology, setTopology] = useState<AgentTopologyItem[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentExecutionLog[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("Orchestrator Agent");
  const [executingAgent, setExecutingAgent] = useState(false);
  const [agentOutput, setAgentOutput] = useState<any>(null);

  // Simulation Lab state
  const [runningSim, setRunningSim] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  const loadAgents = async () => {
    try {
      const [top, logs] = await Promise.all([
        api.getTopology().catch(() => ({ agents: [] })),
        api.getAgentLogs(20).catch(() => []),
      ]);
      setTopology(top.agents || []);
      setAgentLogs(logs || []);
    } catch {}
  };

  useEffect(() => {
    if (subView === "agents") {
      loadAgents();
    }
  }, [subView]);

  const effectiveInputLang =
    settings.voiceInputLang === "auto"
      ? language === "en"
        ? "en-IN"
        : `${language}-IN`
      : settings.voiceInputLang;

  const executeCommandWorkflow = async (transcript: string, langCode: string) => {
    setIsLoading(true);
    setRecorderError(null);
    try {
      const res = await api.executeVoiceCommand(selectedMerchantId, transcript, langCode);
      const item: MessageHistoryItem = {
        id: Date.now().toString(),
        timestamp: formatTime(new Date(), language),
        language: settings.voiceOutputLang,
        userQuery: transcript,
        response: res,
      };
      setHistory((prev) => [item, ...prev]);

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
      setRecorderError(err?.message || t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      setRecorderError(null);
      const rec = new AudioRecorder();
      recorderRef.current = rec;
      await rec.start();
      setIsRecording(true);
    } catch {
      setRecorderError(
        "Microphone access blocked or unavailable. Enter your voice command in text below."
      );
    }
  };

  const handleStopRecording = async () => {
    if (!recorderRef.current) return;
    setIsRecording(false);
    setIsLoading(true);
    try {
      const audioBlob = await recorderRef.current.stop();
      let transcript = "";
      try {
        const sttResult = await api.transcribeAudio(audioBlob, effectiveInputLang);
        transcript = sttResult.transcript || "";
      } catch {}
      await executeCommandWorkflow(transcript || t("voice.sample1"), effectiveInputLang);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isLoading) return;
    const q = textInput.trim();
    setTextInput("");
    executeCommandWorkflow(q, effectiveInputLang);
  };

  const handleReplay = async (item: MessageHistoryItem) => {
    if (item.response.tts_audio_base64) {
      await playBase64Audio(item.response.tts_audio_base64);
    } else if (item.response.spoken_reply_text) {
      await speakFallbackText(
        item.response.spoken_reply_text,
        settings.voiceOutputLang,
        settings.voiceSpeed
      );
    }
  };

  const handleRunAgent = async () => {
    setExecutingAgent(true);
    setAgentOutput(null);
    const actionMap: Record<string, string> = {
      "Merchant Agent": "CHECK_ITEM_STOCK",
      "Demand Intelligence Agent": "PREDICT_DEMAND",
      "Supplier Agent": "GET_PRICE_QUOTES",
      "Negotiation Agent": "NEGOTIATE_GROUP_BUY",
      "Trust and Governance Agent": "VERIFY_AUDIT_TRAIL",
    };
    try {
      const res = await api.executeAgent({
        caller_agent: selectedAgent,
        action: actionMap[selectedAgent] || "EXECUTE_END_TO_END_CYCLE",
        target_merchant_id: selectedMerchantId,
        payload: {
          item_name: "Aashirvaad Superior MP Atta 10kg",
          sku: "SKU-ATTA-01",
          requested_qty: 50,
          horizon_days: 7,
        },
      });
      setAgentOutput(res);
      await loadAgents();
      onRefresh();
    } catch (err: any) {
      setAgentOutput({ error: err.message });
    } finally {
      setExecutingAgent(false);
    }
  };

  const runScenario = async (
    scenario: "SUPPLY_SHOCK" | "FESTIVAL_DEMAND_SURGE" | "PEER_REBALANCE" | "RESET_SIMULATION"
  ) => {
    setRunningSim(true);
    setSimResult(null);
    try {
      const res = await api.triggerSimulation(scenario);
      setSimResult(res);
      onRefresh();
    } catch (err: any) {
      setSimResult({ error: err.message });
    } finally {
      setRunningSim(false);
    }
  };

  const samplePrompts = [
    t("voice.sample1"),
    t("voice.sample2"),
    t("voice.sample3"),
    t("voice.sample4"),
  ];

  const isPrismaLive = gnaniStatus?.gnani_stt?.is_configured ?? false;
  const isTimbreLive = gnaniStatus?.gnani_tts?.is_configured ?? false;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="originos-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t("voice.title")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("voice.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubView("voice")}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              subView === "voice"
                ? "bg-blue-600 text-white shadow-originos-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("nav.aiAssistant")}</span>
          </button>

          {(settings.advancedMode || subView !== "voice") && (
            <>
              <button
                onClick={() => setSubView("agents")}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  subView === "agents"
                    ? "bg-blue-600 text-white shadow-originos-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Multi-Agent Network</span>
              </button>
              <button
                onClick={() => setSubView("simulation")}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  subView === "simulation"
                    ? "bg-blue-600 text-white shadow-originos-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Simulation Lab</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* VOICE SUB-VIEW */}
      {subView === "voice" && (
        <>
          {recorderError && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{recorderError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Recording Console with Independent Voice Language Selectors */}
            <div className="lg:col-span-5 originos-card p-6 flex flex-col items-center text-center space-y-5">
              {/* Independent Voice Input & Output Language Controls */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {t("voice.voiceInputLang")}
                  </label>
                  <select
                    value={settings.voiceInputLang}
                    onChange={(e) => updateSetting("voiceInputLang", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  >
                    <option value="auto">{t("voice.autoDetect")}</option>
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.voiceLangCode}>
                        {l.nativeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {t("voice.voiceOutputLang")}
                  </label>
                  <select
                    value={settings.voiceOutputLang}
                    onChange={(e) => updateSetting("voiceOutputLang", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.voiceLangCode}>
                        {l.nativeName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Soft OriginOS Mic Orb */}
              <div className="py-3">
                <button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={isLoading}
                  className={`w-28 h-28 rounded-full flex flex-col items-center justify-center text-white transition-all shadow-originos-float ${
                    isRecording
                      ? "bg-gradient-to-br from-rose-500 to-amber-500 scale-105 originos-voice-pulse"
                      : "bg-gradient-to-br from-blue-600 to-violet-600 hover:scale-105"
                  }`}
                >
                  {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  <span className="text-[11px] font-bold mt-1">
                    {isRecording ? t("home.stopListening") : t("home.tapToSpeak")}
                  </span>
                </button>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isLoading
                  ? t("home.processing")
                  : isRecording
                  ? t("home.listening")
                  : t("voice.codeMixedNote")}
              </div>

              {/* Gnani Status Pills */}
              <div className="flex flex-wrap justify-center gap-2 text-[11px]">
                <span
                  className={`px-2.5 py-1 rounded-full font-semibold ${
                    isPrismaLive
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  Gnani Prisma STT: {isPrismaLive ? "Live" : "Pending Key"}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full font-semibold ${
                    isTimbreLive
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  Gnani Timbre TTS: {isTimbreLive ? "Live" : "Pending Key"}
                </span>
              </div>

              {/* Text Input Fallback */}
              <form onSubmit={handleTextSubmit} className="w-full flex gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={t("voice.typePlaceholder")}
                  className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  type="submit"
                  disabled={isLoading || !textInput.trim()}
                  className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t("voice.send")}</span>
                </button>
              </form>
            </div>

            {/* Right Column: Sample Queries + Execution History */}
            <div className="lg:col-span-7 space-y-5">
              {/* Sample Queries */}
              <div className="originos-card p-5 space-y-3">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {t("voice.sampleQueries")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {samplePrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => executeCommandWorkflow(prompt, effectiveInputLang)}
                      disabled={isLoading}
                      className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/70 dark:border-slate-700/50 text-left text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      “{prompt}”
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversation History */}
              <div className="originos-card p-5 space-y-4">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {t("home.recentActivity")}
                </h2>

                {history.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    {t("home.noRecentActivity")}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            {settings.showTranscriptText && (
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {t("voice.transcription")} {item.userQuery}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {item.timestamp} &bull; {t("voice.interpretation")}{" "}
                              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                {item.response.detected_intent}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleReplay(item)}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-blue-600 dark:text-blue-300"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{t("voice.replayAudio")}</span>
                          </button>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-700/50 text-xs text-slate-800 dark:text-slate-100">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400 mb-1">
                            <Bot className="w-3.5 h-3.5" />
                            <span>{t("voice.response")}</span>
                          </div>
                          <p>{item.response.spoken_reply_text}</p>
                        </div>

                        {item.response.orchestration_result?.requires_human_approval && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                            {t("common.humanApprovalRequired")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* AGENTS SUB-VIEW (Advanced Mode) */}
      {subView === "agents" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topology.map((agent) => (
              <button
                key={agent.name}
                onClick={() => setSelectedAgent(agent.name)}
                className={`text-left originos-card p-5 space-y-2 border-2 transition-all ${
                  selectedAgent === agent.name
                    ? "border-blue-600"
                    : "border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {agent.name}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {t("common.active")}
                  </span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {agent.role}
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {agent.capabilities?.map((cap) => (
                    <span
                      key={cap}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <div className="originos-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedAgent}
              </div>
              <div className="text-xs text-slate-500">
                Execute structured backend operation cycle
              </div>
            </div>
            <button
              onClick={handleRunAgent}
              disabled={executingAgent}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{executingAgent ? t("common.loading") : "Execute Agent"}</span>
            </button>
          </div>

          {agentOutput && (
            <pre className="originos-card p-4 text-xs font-mono text-slate-700 dark:text-slate-200 overflow-x-auto max-h-72">
              {JSON.stringify(agentOutput, null, 2)}
            </pre>
          )}

          {agentLogs.length > 0 && (
            <div className="originos-card p-5 space-y-2.5 max-h-72 overflow-y-auto">
              {agentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {log.agent_name}:
                    </span>{" "}
                    <span className="text-slate-600 dark:text-slate-300">{log.details}</span>
                  </div>
                  <span className="shrink-0 text-[11px] font-mono text-slate-400">
                    {log.latency_ms}ms
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SIMULATION LAB SUB-VIEW (Advanced Mode) */}
      {subView === "simulation" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="originos-card p-5 space-y-4">
              <div className="text-base font-bold text-slate-900 dark:text-white">
                Supply Shock (Edible Oil)
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simulates depot transit freeze and broadcasts an urgent NIP shortage signal.
              </p>
              <button
                onClick={() => runScenario("SUPPLY_SHOCK")}
                disabled={runningSim}
                className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Trigger Supply Shock</span>
              </button>
            </div>

            <div className="originos-card p-5 space-y-4">
              <div className="text-base font-bold text-slate-900 dark:text-white">
                Festival Demand Surge (+65%)
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Applies festive demand uplift across staples and prepares group buy proposals.
              </p>
              <button
                onClick={() => runScenario("FESTIVAL_DEMAND_SURGE")}
                disabled={runningSim}
                className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate Festival Surge</span>
              </button>
            </div>

            <div className="originos-card p-5 space-y-4">
              <div className="text-base font-bold text-slate-900 dark:text-white">
                Lateral Store Rebalance
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Shares surplus oil packets between neighbouring stores in 30 minutes.
              </p>
              <button
                onClick={() => runScenario("PEER_REBALANCE")}
                disabled={runningSim}
                className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Execute Rebalance</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => runScenario("RESET_SIMULATION")}
              disabled={runningSim}
              className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Simulation</span>
            </button>
          </div>

          {simResult && (
            <pre className="originos-card p-4 text-xs font-mono text-slate-700 dark:text-slate-200 overflow-x-auto">
              {JSON.stringify(simResult, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
