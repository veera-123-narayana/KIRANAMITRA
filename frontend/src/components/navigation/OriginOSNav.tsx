"use client";

import React from "react";
import {
  Home,
  Store,
  Sparkles,
  Network,
  TrendingUp,
  Settings,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export type NavTab = "home" | "my_business" | "ai_assistant" | "local_network" | "insights" | "settings";

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingApprovalsCount: number;
  criticalSignalsCount: number;
}

export function OriginOSNav({
  activeTab,
  onSelectTab,
  pendingApprovalsCount,
  criticalSignalsCount,
}: Props) {
  const { t } = useTranslation();

  const NAV_ITEMS: Array<{ id: NavTab; labelKey: string; icon: any; badge?: number }> = [
    { id: "home", labelKey: "nav.home", icon: Home },
    { id: "my_business", labelKey: "nav.myBusiness", icon: Store, badge: pendingApprovalsCount },
    { id: "ai_assistant", labelKey: "nav.aiAssistant", icon: Sparkles },
    { id: "local_network", labelKey: "nav.localNetwork", icon: Network, badge: criticalSignalsCount },
    { id: "insights", labelKey: "nav.insights", icon: TrendingUp },
    { id: "settings", labelKey: "nav.settings", icon: Settings },
  ];

  return (
    <>
      {/* Desktop Top/Header Tab Bar */}
      <nav className="hidden md:flex items-center gap-1.5 px-6 py-2 bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-originos-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`} />
                  <span>{t(item.labelKey)}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
            KIRANAMITRA OS 6
          </div>
        </div>
      </nav>

      {/* Mobile / Tablet Floating Bottom Navigation */}
      <nav className="md:hidden fixed bottom-3 left-4 right-4 z-40 originos-card p-1.5 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-originos-lg backdrop-blur-xl">
        <div className="grid grid-cols-6 gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-medium transition-all ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50/80 dark:bg-blue-950/40"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="truncate max-w-[50px]">{t(item.labelKey)}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

