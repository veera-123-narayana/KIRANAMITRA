"use client";

import React, { useState } from "react";
import {
  Sun,
  Moon,
  Globe2,
  Bell,
  Store,
  ChevronDown,
  Check,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSettings } from "@/lib/settings/SettingsContext";
import { SUPPORTED_LANGUAGES, SupportedLanguage } from "@/lib/i18n/types";
import { formatTime, formatDate } from "@/lib/i18n/formatters";
import { Merchant, GnaniStatus } from "@/lib/types";

interface Props {
  merchants: Merchant[];
  selectedMerchantId: string;
  onSelectMerchant: (id: string) => void;
  gnaniStatus: GnaniStatus | null;
  pendingApprovalsCount: number;
  onNotificationClick?: () => void;
}

export function OriginOSHeader({
  merchants,
  selectedMerchantId,
  onSelectMerchant,
  gnaniStatus,
  pendingApprovalsCount,
  onNotificationClick,
}: Props) {
  const { language, setLanguage, languageInfo, t } = useLanguage();
  const { settings, updateSetting, resolvedTheme } = useSettings();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const currentMerchant = merchants.find((m) => m.id === selectedMerchantId) || merchants[0];
  const ownerName = currentMerchant?.owner_name || "Merchant";

  // Dynamic Greeting based on time
  const currentHour = new Date().getHours();
  const greetingKey =
    currentHour < 12
      ? "home.greetingMorning"
      : currentHour < 17
      ? "home.greetingAfternoon"
      : "home.greetingEvening";

  const toggleTheme = () => {
    updateSetting("theme", resolvedTheme === "dark" ? "light" : "dark");
  };

  const isGnaniLive =
    gnaniStatus?.gnani_stt.is_configured || gnaniStatus?.gnani_tts.is_configured;

  return (
    <header className="sticky top-0 z-30 w-full originos-glass-bar px-4 md:px-8 py-3.5 flex items-center justify-between transition-colors">
      {/* Left: Personalized Greeting & Date */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-originos-sm">
          {ownerName.charAt(0)}
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>
              {t(greetingKey)}, {ownerName}
            </span>
            {settings.easyMode && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                {t("common.easyMode")}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {formatDate(new Date(), language, { weekday: "short", month: "short", day: "numeric" })} &bull;{" "}
            {formatTime(new Date(), language)}
          </div>
        </div>
      </div>

      {/* Right Controls: Store Selector, Language Switcher, Theme Toggle, Notifications */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Store Selector Pill */}
        <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
          <Store className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <select
            value={selectedMerchantId}
            onChange={(e) => onSelectMerchant(e.target.value)}
            className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer pr-4 appearance-none"
          >
            {merchants.map((m) => (
              <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {m.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-2" />
        </div>

        {/* Global Language Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all shadow-originos-sm"
          >
            <Globe2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{languageInfo.nativeName}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {langDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setLangDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 originos-card p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-originos-lg z-50 animate-fadeIn">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  {t("settings.displayLanguage")}
                </div>
                <div className="space-y-0.5 max-h-64 overflow-y-auto">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-left transition-all ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <div>
                          <div className="font-sans">{lang.nativeName}</div>
                          <div className="text-[10px] text-slate-400">{lang.name}</div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-all shadow-originos-sm"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            onClick={onNotificationClick}
            aria-label="Notifications"
            className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-all shadow-originos-sm"
          >
            <Bell className="w-4 h-4" />
          </button>
          {pendingApprovalsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {pendingApprovalsCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

