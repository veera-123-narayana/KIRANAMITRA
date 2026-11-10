"use client";

import React, { useState, useEffect } from "react";
import { Check, Globe2, Sparkles, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { SUPPORTED_LANGUAGES, SupportedLanguage } from "@/lib/i18n/types";

export function LanguageOnboardingModal() {
  const { language, setLanguage, isFirstLaunch, completeOnboarding, t } = useLanguage();
  const [selected, setSelected] = useState<SupportedLanguage>(language);

  useEffect(() => {
    setSelected(language);
  }, [language, isFirstLaunch]);

  if (!isFirstLaunch) return null;

  const handleSelect = (lang: SupportedLanguage) => {
    setSelected(lang);
    setLanguage(lang); // Updates translation reactively for instant preview
  };

  const handleContinue = () => {
    completeOnboarding();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl originos-card p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-originos-lg overflow-hidden relative">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-1">
            <Globe2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("onboarding.title")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {t("onboarding.subtitle")}
          </p>
        </div>

        {/* 8 Language Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = selected === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between h-20 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 dark:border-blue-500 shadow-originos-sm scale-[1.02]"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900 dark:text-white font-sans">
                    {lang.nativeName}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  {lang.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Interface Preview Card */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>{t("onboarding.previewLabel")}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
              {SUPPORTED_LANGUAGES.find((l) => l.code === selected)?.nativeName}
            </span>
          </div>

          <div className="pt-1">
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {t("onboarding.previewGreeting")}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t("home.welcomeMessage")}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-originos-float"
        >
          <span>{t("onboarding.continueBtn")}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

