"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SupportedLanguage } from "@/lib/i18n/types";

export type ThemeMode = "light" | "dark" | "system";
export type FontSize = "normal" | "large" | "extra-large";
export type AccentColor = "blue" | "violet" | "emerald";

export interface AppSettings {
  // Voice Independent Preferences
  voiceInputLang: string; // "auto", "te-IN", "en-IN", "hi-IN", "ta-IN", "kn-IN", "ml-IN", "bn-IN", "mr-IN"
  voiceOutputLang: string; // "te-IN", "en-IN", "hi-IN", "ta-IN", "kn-IN", "ml-IN", "bn-IN", "mr-IN"
  voiceSpeed: number; // 0.8 to 1.2
  showTranscriptText: boolean;

  // Appearance
  theme: ThemeMode;
  accentColor: AccentColor;

  // Accessibility
  fontSize: FontSize;
  highContrast: boolean;
  easyMode: boolean;
  reducedMotion: boolean;

  // Mode
  advancedMode: boolean; // Enables technical 3D twin, agent schemas, and raw NIP logs

  // Notifications
  orderNotifications: boolean;
  stockAlerts: boolean;
  aiRecommendations: boolean;

  // Privacy
  participateInNip: boolean;
  anonymizeInNip: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  voiceInputLang: "auto",
  voiceOutputLang: "te-IN",
  voiceSpeed: 1.0,
  showTranscriptText: true,

  theme: "light", // Default to OriginOS clean soft light theme
  accentColor: "blue",

  fontSize: "normal",
  highContrast: false,
  easyMode: false,
  reducedMotion: false,

  advancedMode: false,

  orderNotifications: true,
  stockAlerts: true,
  aiRecommendations: true,

  participateInNip: true,
  anonymizeInNip: false,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  resolvedTheme: "light" | "dark";
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = "kiranamitra_user_settings";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState<boolean>(false);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
    setMounted(true);
  }, []);

  // Sync theme to <html> class
  useEffect(() => {
    let activeTheme: "light" | "dark" = "light";
    if (settings.theme === "system") {
      const isSystemDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
      activeTheme = isSystemDark ? "dark" : "light";
    } else {
      activeTheme = settings.theme;
    }
    setResolvedTheme(activeTheme);

    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (activeTheme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }

      // Font size class
      root.classList.remove("font-size-normal", "font-size-large", "font-size-extra-large");
      root.classList.add(`font-size-${settings.fontSize}`);

      // High contrast class
      if (settings.highContrast) {
        root.classList.add("high-contrast");
      } else {
        root.classList.remove("high-contrast");
      }

      // Easy Mode class
      if (settings.easyMode) {
        root.classList.add("easy-mode");
      } else {
        root.classList.remove("easy-mode");
      }

      // Reduced motion
      if (settings.reducedMotion) {
        root.classList.add("reduced-motion");
      } else {
        root.classList.remove("reduced-motion");
      }
    }
  }, [settings.theme, settings.fontSize, settings.highContrast, settings.easyMode, settings.reducedMotion]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch {}
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings, resolvedTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

