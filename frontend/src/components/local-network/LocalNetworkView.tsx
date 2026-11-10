"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Network,
  ShieldCheck,
  AlertTriangle,
  Share2,
  Send,
  EyeOff,
  Eye,
  Radio,
  Box,
  Store,
  Truck,
  RefreshCw,
  Handshake,
} from "lucide-react";
import * as THREE from "three";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSettings } from "@/lib/settings/SettingsContext";
import { formatCurrency, formatNumber, formatTime } from "@/lib/i18n/formatters";
import { api } from "@/lib/api";
import { NIPSignal, CoordinationProposal, DigitalTwinState } from "@/lib/types";

interface Props {
  selectedMerchantId: string;
  signals: NIPSignal[];
  proposals: CoordinationProposal[];
  onRefresh: () => void;
}

export function LocalNetworkView({
  selectedMerchantId,
  signals,
  proposals,
  onRefresh,
}: Props) {
  const { language, t } = useLanguage();
  const { settings, resolvedTheme } = useSettings();

  const [viewMode, setViewMode] = useState<"simple" | "3d">("simple");
  const [disruptions, setDisruptions] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [privacyMaskActive, setPrivacyMaskActive] = useState<boolean>(
    settings.anonymizeInNip
  );

  // Broadcast form
  const [signalType, setSignalType] = useState("SUPPLY_SHORTAGE");
  const [commodity, setCommodity] = useState("Aashirvaad Superior MP Atta 10kg");
  const [severity, setSeverity] = useState("HIGH");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Digital Twin 3D state
  const [twinState, setTwinState] = useState<DigitalTwinState | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);

  const loadNetworkData = async () => {
    try {
      const [dis, opps, twin] = await Promise.all([
        api.getClusterDisruptions().catch(() => []),
        api.getOpportunities().catch(() => []),
        api.getDigitalTwinState().catch(() => null),
      ]);
      setDisruptions(dis || []);
      setOpportunities(opps || []);
      if (twin) {
        setTwinState(twin);
        if (twin.nodes?.length > 0 && !selectedNode) {
          setSelectedNode(twin.nodes[0]);
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadNetworkData();
  }, [selectedMerchantId]);

  useEffect(() => {
    setPrivacyMaskActive(settings.anonymizeInNip);
  }, [settings.anonymizeInNip]);

  // Interactive 3D WebGL canvas when in 3D view
  useEffect(() => {
    if (viewMode !== "3d" || !mountRef.current || !twinState) return;

    const width = mountRef.current.clientWidth || 640;
    const height = 440;

    const isDark = resolvedTheme === "dark";
    const bgHex = isDark ? 0x0b1120 : 0xf1f5f9;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 35, 45);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    const gridHelper = new THREE.GridHelper(
      60,
      30,
      isDark ? 0x3b82f6 : 0x2563eb,
      isDark ? 0x1e293b : 0xcbd5e1
    );
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.65 : 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    const nodeMeshes: THREE.Mesh[] = [];

    twinState.nodes.forEach((node) => {
      const isStore = node.type === "MERCHANT_STORE";
      const isCritical = node.metrics?.critical_shortages > 0;
      const boxH = isStore ? 3.5 : 5.0;
      const geometry = new THREE.BoxGeometry(
        isStore ? 3 : 5,
        boxH,
        isStore ? 3 : 5
      );
      const color = isStore
        ? isCritical
          ? 0xef4444
          : 0x2563eb
        : 0x7c3aed;

      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.35,
        metalness: 0.4,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        node.coords_3d.x * 0.4,
        boxH / 2,
        node.coords_3d.z * 0.4
      );
      (mesh as any).nodeData = node;
      scene.add(mesh);
      nodeMeshes.push(mesh);

      if (isCritical) {
        const ringGeo = new THREE.RingGeometry(2.5, 3.2, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.65,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(
          node.coords_3d.x * 0.4,
          0.05,
          node.coords_3d.z * 0.4
        );
        scene.add(ring);
      }
    });

    twinState.routes.forEach((route) => {
      const points = route.coordinates_path.map(
        (p) => new THREE.Vector3(p.x * 0.4, p.y + 0.3, p.z * 0.4)
      );
      if (points.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.14, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
          color: route.status === "LATERAL_PEER_REBALANCE" ? 0x10b981 : 0x2563eb,
          transparent: true,
          opacity: 0.8,
        });
        scene.add(new THREE.Mesh(tubeGeo, tubeMat));
      }
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object as any;
        if (hit.nodeData) setSelectedNode(hit.nodeData);
      }
    };

    renderer.domElement.addEventListener("click", handleClick);

    let animationFrameId: number;
    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!settings.reducedMotion) {
        scene.rotation.y = Math.sin(clock.getElapsedTime() * 0.12) * 0.15;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.domElement.removeEventListener("click", handleClick);
      renderer.dispose();
    };
  }, [viewMode, twinState, resolvedTheme, settings.reducedMotion]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBroadcasting(true);
    try {
      await api.broadcastSignal({
        signal_type: signalType as any,
        commodity,
        severity: severity as any,
        origin_merchant_id: selectedMerchantId,
        anonymized_payload: {
          broadcast_source: "Manual Merchant Signal",
          timestamp: new Date().toISOString(),
        },
        radius_meters: 2500,
      });
      await loadNetworkData();
      onRefresh();
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="originos-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t("network.title")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("network.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Privacy Shield Toggle */}
          <button
            onClick={() => setPrivacyMaskActive(!privacyMaskActive)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t("network.privacyShieldActive")}</span>
            {privacyMaskActive ? (
              <EyeOff className="w-3.5 h-3.5 ml-1" />
            ) : (
              <Eye className="w-3.5 h-3.5 ml-1" />
            )}
          </button>

          {/* Simple vs Advanced 3D Grid Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setViewMode("simple")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === "simple"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-originos-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {t("network.simpleView")}
            </button>
            <button
              onClick={() => setViewMode("3d")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === "3d"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-originos-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>{t("network.advancedView")}</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === "3d" ? (
        /* 3D DIGITAL TWIN VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 originos-card overflow-hidden relative">
            <div ref={mountRef} className="w-full h-[440px] cursor-grab active:cursor-grabbing" />
            <div className="p-4 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{twinState?.cluster_name || "Cluster Digital Twin"}</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  {t("network.nearbyShops")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  {t("network.shortages")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                  {t("network.suppliers")}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 originos-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {selectedNode?.type === "MERCHANT_STORE" ? (
                  <Store className="w-4 h-4 text-blue-600" />
                ) : (
                  <Truck className="w-4 h-4 text-violet-600" />
                )}
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedNode ? selectedNode.name : t("common.select")}
                </h3>
              </div>
              <button
                onClick={loadNetworkData}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {selectedNode && (
              <div className="space-y-3 text-xs">
                <div className="text-slate-600 dark:text-slate-300">
                  {selectedNode.address}
                </div>
                {selectedNode.inventory_summary && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedNode.inventory_summary.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                          {item.name}
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {item.stock} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SIMPLE SHOPKEEPER VIEW */
        <>
          {/* Row 1: Group Buy Deals + Lateral Transfers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Group Buy Pools */}
            <div className="originos-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-blue-600" />
                  <span>{t("network.groupBuys")}</span>
                </h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  {proposals.length}
                </span>
              </div>

              <div className="space-y-3">
                {proposals.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {p.title}
                        </h3>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {p.target_supplier_name}
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        -{p.projected_savings_pct}%
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-white dark:bg-slate-900/60 text-xs">
                      <div>
                        <div className="text-slate-400 text-[11px]">Standard</div>
                        <div className="line-through text-slate-500 font-semibold">
                          {formatCurrency(p.standard_unit_price, language)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[11px]">Group Price</div>
                        <div className="text-emerald-600 font-bold">
                          {formatCurrency(p.negotiated_unit_price, language)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[11px]">Savings</div>
                        <div className="text-blue-600 font-bold">
                          {formatCurrency(p.projected_savings_inr, language)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Store-to-Store Consignments & Shortage Radar */}
            <div className="space-y-6">
              <div className="originos-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-emerald-600" />
                    <span>{t("network.lateralTransfers")}</span>
                  </h2>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {t("network.instantTransfer")}
                  </span>
                </div>

                {opportunities.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    {t("home.noRecentActivity")}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {opportunities.map((opp, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                          <span>{opp.item_name}</span>
                          <span className="text-emerald-600">
                            {opp.transfer_quantity} {opp.unit}
                          </span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">
                          {privacyMaskActive ? "Nearby Store A" : opp.source_merchant} &rarr;{" "}
                          {privacyMaskActive ? "Nearby Store B" : opp.destination_merchant}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="originos-card p-6 space-y-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>{t("network.shortages")}</span>
                </h2>
                {disruptions.map((d, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-rose-800 dark:text-rose-200">
                      <span>{d.commodity}</span>
                      <span>{d.risk_severity}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">{d.opportunity}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Broadcast Signal + Live Signal Bus */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleBroadcast}
              className="lg:col-span-4 originos-card p-6 space-y-3.5"
            >
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-600" />
                <span>{t("network.signals")}</span>
              </h2>

              <select
                value={signalType}
                onChange={(e) => setSignalType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
              >
                <option value="SUPPLY_SHORTAGE">SUPPLY_SHORTAGE</option>
                <option value="SURPLUS_SHARING">SURPLUS_SHARING</option>
                <option value="BULK_POOLING_REQUEST">BULK_POOLING_REQUEST</option>
                <option value="PRICE_SPIKE">PRICE_SPIKE</option>
              </select>

              <input
                type="text"
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />

              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>

              <button
                type="submit"
                disabled={isBroadcasting}
                className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isBroadcasting ? t("common.loading") : t("voice.send")}</span>
              </button>
            </form>

            <div className="lg:col-span-8 originos-card p-6 space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t("network.signals")} ({formatNumber(signals.length, language)})
              </h2>
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {signals.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {sig.commodity}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {sig.signal_type} &bull;{" "}
                        {privacyMaskActive ? "ANONYMIZED" : sig.origin_merchant_id || "CLUSTER"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {sig.severity}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {formatTime(sig.created_at, language)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

