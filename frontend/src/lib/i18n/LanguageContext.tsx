"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { SupportedLanguage, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LanguageInfo } from "./types";

import en from "@/messages/en.json";
import te from "@/messages/te.json";
import hi from "@/messages/hi.json";
import ta from "@/messages/ta.json";
import kn from "@/messages/kn.json";
import ml from "@/messages/ml.json";
import bn from "@/messages/bn.json";
import mr from "@/messages/mr.json";

const TRANSLATIONS: Record<SupportedLanguage, any> = {
  en,
  te,
  hi,
  ta,
  kn,
  ml,
  bn,
  mr,
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  languageInfo: LanguageInfo;
  t: (path: string, fallback?: string) => string;
  isFirstLaunch: boolean;
  completeOnboarding: () => void;
  openOnboarding: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_LANG_KEY = "kiranamitra_display_lang";
const STORAGE_ONBOARDING_KEY = "kiranamitra_onboarding_completed";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    // Check localStorage
    try {
      const storedLang = localStorage.getItem(STORAGE_LANG_KEY) as SupportedLanguage | null;
      const onboardingCompleted = localStorage.getItem(STORAGE_ONBOARDING_KEY);

      if (storedLang && TRANSLATIONS[storedLang]) {
        setLanguageState(storedLang);
      } else {
        // If no language has been chosen yet, show onboarding
        setIsFirstLaunch(true);
      }

      if (!onboardingCompleted && !storedLang) {
        setIsFirstLaunch(true);
      }
    } catch {
      // Fallback
    }
    setMounted(true);
  }, []);

  const setLanguage = (newLang: SupportedLanguage) => {
    if (!TRANSLATIONS[newLang]) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, newLang);
    } catch {}
  };

  const completeOnboarding = () => {
    setIsFirstLaunch(false);
    try {
      localStorage.setItem(STORAGE_ONBOARDING_KEY, "true");
    } catch {}
  };

  const openOnboarding = () => {
    setIsFirstLaunch(true);
  };

  const languageInfo = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  /**
   * Helper function to query dot-separated keys, e.g. t('home.welcomeMessage')
   */
  const t = (path: string, fallback?: string): string => {
    const keys = path.split(".");
    let current: any = TRANSLATIONS[language];

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        // Fallback to English
        let fallbackVal: any = TRANSLATIONS.en;
        for (const fbKey of keys) {
          if (fallbackVal && typeof fallbackVal === "object" && fbKey in fallbackVal) {
            fallbackVal = fallbackVal[fbKey];
          } else {
            fallbackVal = undefined;
            break;
          }
        }
        if (typeof fallbackVal === "string") {
          return fallbackVal;
        }
        return fallback || path;
      }
    }

    if (typeof current === "string") {
      return current;
    }
    return fallback || path;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        languageInfo,
        t,
        isFirstLaunch,
        completeOnboarding,
        openOnboarding,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function useTranslation() {
  const { t, language, languageInfo } = useLanguage();
  return { t, language, languageInfo };
}

