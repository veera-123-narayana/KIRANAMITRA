"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { OriginOSHeader } from "@/components/navigation/OriginOSHeader";
import { OriginOSNav, NavTab } from "@/components/navigation/OriginOSNav";
import { HomeView } from "@/components/home/HomeView";
import { BusinessView } from "@/components/business/BusinessView";
import { AIAssistantView } from "@/components/ai-assistant/AIAssistantView";
import { LocalNetworkView } from "@/components/local-network/LocalNetworkView";
import { InsightsView } from "@/components/insights/InsightsView";
import { SettingsView } from "@/components/settings/SettingsView";
import { useSettings } from "@/lib/settings/SettingsContext";
import { api } from "@/lib/api";
import {
  Merchant,
  NIPSignal,
  CoordinationProposal,
  GovernanceAction,
  DemandPrediction,
  InventoryItem,
  GnaniStatus,
} from "@/lib/types";

export default function Home() {
  const { settings } = useSettings();

  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("shop_lakshmi");
  const [gnaniStatus, setGnaniStatus] = useState<GnaniStatus | null>(null);
  const [signals, setSignals] = useState<NIPSignal[]>([]);
  const [proposals, setProposals] = useState<CoordinationProposal[]>([]);
  const [pendingActions, setPendingActions] = useState<GovernanceAction[]>([]);
  const [predictions, setPredictions] = useState<DemandPrediction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [merch, gnani, sigs, props, actions, preds] = await Promise.all([
        api.getMerchants().catch(() => []),
        api.getGnaniStatus().catch(() => null),
        api.getNIPSignals().catch(() => []),
        api.getProposals().catch(() => []),
        api.getApprovalQueue("PENDING_APPROVAL").catch(() => []),
        api.getPredictions().catch(() => []),
      ]);

      if (merch.length > 0) {
        setMerchants(merch);
        if (!selectedMerchantId || !merch.some((m: Merchant) => m.id === selectedMerchantId)) {
          setSelectedMerchantId(merch[0].id);
        }
      }
      setGnaniStatus(gnani);
      setSignals(sigs);
      setProposals(props);
      setPendingActions(actions);
      setPredictions(preds);

      if (selectedMerchantId) {
        const inv = await api.getMerchantInventory(selectedMerchantId).catch(() => []);
        setInventory(inv);
      }
    } catch (err) {
      console.error("Error loading platform state", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedMerchantId]);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 15000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  const criticalSignalsCount = signals.filter((s) => s.severity === "CRITICAL").length;
  const pendingApprovalsCount = pendingActions.length;

  const handleNavigateToTab = (tab: NavTab) => setActiveTab(tab);

  const renderActiveView = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeView
            merchants={merchants}
            selectedMerchantId={selectedMerchantId}
            signals={signals}
            proposals={proposals}
            pendingActions={pendingActions}
            predictions={predictions}
            inventory={inventory}
            gnaniStatus={gnaniStatus}
            isRefreshing={isRefreshing}
            onNavigate={handleNavigateToTab}
            onRefresh={loadAllData}
          />
        );
      case "my_business":
        return (
          <BusinessView
            selectedMerchantId={selectedMerchantId}
            inventory={inventory}
            proposals={proposals}
            onRefresh={loadAllData}
          />
        );
      case "ai_assistant":
        return (
          <AIAssistantView
            selectedMerchantId={selectedMerchantId}
            gnaniStatus={gnaniStatus}
            onRefresh={loadAllData}
          />
        );
      case "local_network":
        return (
          <LocalNetworkView
            selectedMerchantId={selectedMerchantId}
            signals={signals}
            proposals={proposals}
            onRefresh={loadAllData}
          />
        );
      case "insights":
        return (
          <InsightsView
            selectedMerchantId={selectedMerchantId}
            predictions={predictions}
            inventory={inventory}
            proposals={proposals}
          />
        );
      case "settings":
        return <SettingsView gnaniStatus={gnaniStatus} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-originos-bg dark:bg-slate-950 flex flex-col">
      {/* Fixed Header */}
      <OriginOSHeader
        merchants={merchants}
        selectedMerchantId={selectedMerchantId}
        onSelectMerchant={setSelectedMerchantId}
        gnaniStatus={gnaniStatus}
        pendingApprovalsCount={pendingApprovalsCount}
        onNotificationClick={() => setActiveTab("my_business")}
      />

      {/* Navigation Tab Bar */}
      <OriginOSNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingApprovalsCount={pendingApprovalsCount}
        criticalSignalsCount={criticalSignalsCount}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          {settings.reducedMotion ? (
            renderActiveView()
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {renderActiveView()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
