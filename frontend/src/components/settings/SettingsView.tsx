"use client";

import React, { useState } from "react";
import {
  Globe2,
  Palette,
  Accessibility,
  Mic,
  Bell,
  ShieldCheck,
  Sun,
  Moon,
  Monitor,
  Check,
  RotateCcw,
  Sparkles,
  Volume2,
  Eye,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { SUPPORTED_LANGUAGES, SupportedLanguage } from "@/lib/i18n/types";
import { useSettings, ThemeMode, FontSize, AccentColor } from "@/lib/settings/SettingsContext";
import { GnaniStatus } from "@/lib/types";

interface Props {
  gnaniStatus: GnaniStatus | null;
}

type SettingsTab = "language" | "appearance" | "accessibility" | "voice" | "notifications" | "privacy";

export function SettingsView({ gnaniStatus }: Props) {
  const { language, setLanguage, openOnboarding, t } = useLanguage();
  const { settings, updateSetting, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>("language");

  const tabs: Array<{ id: SettingsTab; labelKey: string; icon: any }> = [
    { id: "language", labelKey: "settings.tabLanguage", icon: Globe2 },
    { id: "appearance", labelKey: "settings.tabAppearance", icon: Palette },
    { id: "accessibility", labelKey: "settings.tabAccessibility", icon: Accessibility },
    { id: "voice", labelKey: "settings.tabVoice", icon: Mic },
    { id: "notifications", labelKey: "settings.tabNotifications", icon: Bell },
    { id: "privacy", labelKey: "settings.tabPrivacy", icon: ShieldCheck },
  ];

  const isPrismaLive = gnaniStatus?.gnani_stt?.is_configured ?? false;
  const isTimbreLive = gnaniStatus?.gnani_tts?.is_configured ?? false;
  const isEvonLive = gnaniStatus?.gnani_evon?.is_configured ?? false;

  const ToggleRow = ({
    label,
    desc,
    checked,
    onChange,
  }: {
    label: string;
    desc?: string;
    checked: boolean;
    onChange: (val: boolean) => void;
  }) => (
    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50">
      <div>
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</div>
        {desc && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="originos-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t("settings.title")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("settings.subtitle")}
          </p>
        </div>

        <button
          onClick={resetSettings}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t("common.retry")}</span>
        </button>
      </div>

      {/* Main Split: Left Vertical Tabs + Right Settings Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 originos-card p-2.5 h-fit space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-left transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-originos-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{t(tab.labelKey)}</span>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-9 originos-card p-6 space-y-6">
          {/* TAB 1: Language & Region (3 Independent Selectors) */}
          {activeTab === "language" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/70 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t("settings.displayLanguage")}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("settings.displayLangDesc")}
                  </p>
                </div>
                <button
                  onClick={openOnboarding}
                  className="self-start sm:self-auto px-4 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                >
                  {t("onboarding.previewLabel")}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const selected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code as SupportedLanguage)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                        selected
                          ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40"
                          : "border-slate-200 dark:border-slate-700/60 hover:border-blue-400"
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {lang.nativeName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{lang.name}</div>
                      </div>
                      {selected && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  );
                })}
              </div>

              {/* Independent Voice Input Language */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200/70 dark:border-slate-800">
                <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 space-y-2">
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-100">
                    {t("settings.voiceInputLang")}
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("settings.voiceInputDesc")}
                  </p>
                  <select
                    value={settings.voiceInputLang}
                    onChange={(e) => updateSetting("voiceInputLang", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-100"
                  >
                    <option value="auto">{t("voice.autoDetect")}</option>
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.voiceLangCode}>
                        {l.nativeName} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Independent Voice Output Language */}
                <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 space-y-2">
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-100">
                    {t("settings.voiceOutputLang")}
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("settings.voiceOutputDesc")}
                  </p>
                  <select
                    value={settings.voiceOutputLang}
                    onChange={(e) => updateSetting("voiceOutputLang", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-100"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.voiceLangCode}>
                        {l.nativeName} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Appearance */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                  {t("settings.appearanceTheme")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(
                    [
                      { id: "light", labelKey: "settings.lightMode", icon: Sun },
                      { id: "dark", labelKey: "settings.darkMode", icon: Moon },
                      { id: "system", labelKey: "settings.systemDefault", icon: Monitor },
                    ] as Array<{ id: ThemeMode; labelKey: string; icon: any }>
                  ).map((item) => {
                    const Icon = item.icon;
                    const active = settings.theme === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => updateSetting("theme", item.id)}
                        className={`p-4 rounded-2xl border-2 flex items-center gap-3 text-sm font-semibold transition-all ${
                          active
                            ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                            : "border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{t(item.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
                  {t("settings.accentColor")}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      { id: "blue", swatch: "bg-blue-600", label: "Origin Blue" },
                      { id: "violet", swatch: "bg-violet-600", label: "Iris Violet" },
                      { id: "emerald", swatch: "bg-emerald-600", label: "Jade Emerald" },
                    ] as Array<{ id: AccentColor; swatch: string; label: string }>
                  ).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => updateSetting("accentColor", c.id)}
                      className={`px-4 py-2.5 rounded-2xl border-2 flex items-center gap-2.5 text-xs font-semibold ${
                        settings.accentColor === c.id
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${c.swatch}`} />
                      <span className="text-slate-800 dark:text-slate-100">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <ToggleRow
                label={t("common.advancedMode")}
                desc="Enables 3D Digital Twin WebGL view, agent execution schemas, and scenario simulation lab."
                checked={settings.advancedMode}
                onChange={(v) => updateSetting("advancedMode", v)}
              />
            </div>
          )}

          {/* TAB 3: Accessibility */}
          {activeTab === "accessibility" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                  {t("settings.fontSize")}
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { id: "normal", labelKey: "settings.fontSizeNormal" },
                      { id: "large", labelKey: "settings.fontSizeLarge" },
                      { id: "extra-large", labelKey: "settings.fontSizeExtraLarge" },
                    ] as Array<{ id: FontSize; labelKey: string }>
                  ).map((sz) => (
                    <button
                      key={sz.id}
                      onClick={() => updateSetting("fontSize", sz.id)}
                      className={`p-3.5 rounded-2xl border-2 text-sm font-semibold transition-all ${
                        settings.fontSize === sz.id
                          ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                          : "border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {t(sz.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <ToggleRow
                label={t("settings.easyMode")}
                desc={t("settings.easyModeDesc")}
                checked={settings.easyMode}
                onChange={(v) => updateSetting("easyMode", v)}
              />

              <ToggleRow
                label={t("settings.highContrast")}
                desc={t("settings.highContrastDesc")}
                checked={settings.highContrast}
                onChange={(v) => updateSetting("highContrast", v)}
              />

              <ToggleRow
                label={t("settings.reducedMotion")}
                desc={t("settings.reducedMotionDesc")}
                checked={settings.reducedMotion}
                onChange={(v) => updateSetting("reducedMotion", v)}
              />
            </div>
          )}

          {/* TAB 4: Voice & Gnani Engine Status */}
          {activeTab === "voice" && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    {t("settings.speechSpeed")}
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {settings.voiceSpeed.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={1.2}
                  step={0.1}
                  value={settings.voiceSpeed}
                  onChange={(e) => updateSetting("voiceSpeed", parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <ToggleRow
                label={t("voice.transcription")}
                desc={t("voice.codeMixedNote")}
                checked={settings.showTranscriptText}
                onChange={(v) => updateSetting("showTranscriptText", v)}
              />

              {/* Gnani Backend Integration Health */}
              <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800 space-y-3">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span>Gnani AI Speech & Reasoning Status</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Gnani Prisma STT
                    </div>
                    <div
                      className={`text-xs font-semibold mt-1 ${
                        isPrismaLive ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {isPrismaLive ? "Live API Connected" : "Integration Pending"}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Gnani Timbre TTS
                    </div>
                    <div
                      className={`text-xs font-semibold mt-1 ${
                        isTimbreLive ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {isTimbreLive ? "Live API Connected" : "Integration Pending"}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Gnani Evon LLM
                    </div>
                    <div
                      className={`text-xs font-semibold mt-1 ${
                        isEvonLive ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {isEvonLive ? "Live API Connected" : "Integration Pending"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Notifications */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t("settings.notificationsTitle")}
              </h2>
              <ToggleRow
                label={t("home.pendingOrders")}
                checked={settings.orderNotifications}
                onChange={(v) => updateSetting("orderNotifications", v)}
              />
              <ToggleRow
                label={t("home.inventoryAlerts")}
                checked={settings.stockAlerts}
                onChange={(v) => updateSetting("stockAlerts", v)}
              />
              <ToggleRow
                label={t("home.intelligenceTitle")}
                checked={settings.aiRecommendations}
                onChange={(v) => updateSetting("aiRecommendations", v)}
              />
            </div>
          )}

          {/* TAB 6: Privacy & Security */}
          {activeTab === "privacy" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    {t("settings.privacyTitle")}
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    {t("settings.privacyDesc")}
                  </p>
                </div>
              </div>

              <ToggleRow
                label={t("nav.localNetwork")}
                desc={t("network.privacyShieldActive")}
                checked={settings.participateInNip}
                onChange={(v) => updateSetting("participateInNip", v)}
              />

              <ToggleRow
                label="Anonymize Store Identity in NIP"
                desc="Masks store name when sharing stock shortage or surplus signals."
                checked={settings.anonymizeInNip}
                onChange={(v) => updateSetting("anonymizeInNip", v)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

