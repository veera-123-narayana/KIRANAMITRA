"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Layers,
  MapPin,
  Store,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Eye,
  RefreshCw,
  Info,
} from "lucide-react";
import * as THREE from "three";
import { api } from "@/lib/api";
import { DigitalTwinState } from "@/lib/types";

export function DigitalTwinView() {
  const [twinState, setTwinState] = useState<DigitalTwinState | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const mountRef = useRef<HTMLDivElement | null>(null);

  const fetchTwinData = async () => {
    try {
      const data = await api.getDigitalTwinState();
      setTwinState(data);
      if (data.nodes && data.nodes.length > 0 && !selectedNode) {
        setSelectedNode(data.nodes[0]);
      }
    } catch (err) {
      console.error("Failed to load Digital Twin", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTwinData();
  }, []);

  // Three.js interactive 3D Canvas
  useEffect(() => {
    if (!mountRef.current || !twinState) return;

    const width = mountRef.current.clientWidth;
    const height = 480;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050811);
    scene.fog = new THREE.FogExp2(0x050811, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 35, 45);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(60, 30, 0x00f0ff, 0x1e293b);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.2);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x8b5cf6, 2, 80);
    pointLight.position.set(-10, 15, -10);
    scene.add(pointLight);

    // Node Meshes
    const nodeMeshes: THREE.Mesh[] = [];

    twinState.nodes.forEach((node) => {
      const isStore = node.type === "MERCHANT_STORE";
      const isCritical = node.metrics?.critical_shortages > 0;

      // Building geometry
      const height = isStore ? 3.5 : 5.0;
      const geometry = new THREE.BoxGeometry(isStore ? 3 : 5, height, isStore ? 3 : 5);

      const color = isStore
        ? isCritical
          ? 0xf43f5e // Red/Rose for stockout risk
          : 0x00f0ff // Cyan for healthy
        : 0x8b5cf6; // Purple for supplier depot

      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        metalness: 0.7,
        emissive: color,
        emissiveIntensity: 0.25,
      });

      const mesh = new THREE.Mesh(geometry, material);
      // Map 3D coordinates from API
      mesh.position.set(node.coords_3d.x * 0.4, height / 2, node.coords_3d.z * 0.4);
      (mesh as any).nodeData = node;
      scene.add(mesh);
      nodeMeshes.push(mesh);

      // Add floating halo / ring if critical shortage
      if (isCritical) {
        const ringGeo = new THREE.RingGeometry(2.5, 3.2, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(node.coords_3d.x * 0.4, 0.05, node.coords_3d.z * 0.4);
        scene.add(ring);
      }
    });

    // Supply Routes (Spline lines)
    twinState.routes.forEach((route) => {
      const points = route.coordinates_path.map(
        (p) => new THREE.Vector3(p.x * 0.4, p.y + 0.3, p.z * 0.4)
      );

      if (points.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.12, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
          color: route.status === "LATERAL_PEER_REBALANCE" ? 0x10b981 : 0x00f0ff,
          transparent: true,
          opacity: 0.7,
        });
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        scene.add(tube);
      }
    });

    // Raycaster for click selection
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
        if (hit.nodeData) {
          setSelectedNode(hit.nodeData);
        }
      }
    };

    renderer.domElement.addEventListener("click", handleClick);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow orbital drift
      scene.rotation.y = Math.sin(elapsedTime * 0.1) * 0.15;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.domElement.removeEventListener("click", handleClick);
      renderer.dispose();
    };
  }, [twinState]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl glass-panel-glow border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Box className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              Autonomous Physical Commerce Simulation
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Neighbourhood Digital Twin (3D Realtime Grid)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulates physical store locations, wholesale supply logistics routes, inventory depletion halos,
            and collaborative micro-distribution across Indiranagar Cluster A. Tap any 3D node to inspect private inventory.
          </p>
        </div>

        <button
          onClick={fetchTwinData}
          className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 hover:text-cyan-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync 3D Grid</span>
        </button>
      </div>

      {/* 3D Canvas + Shop Inspection Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Map Viewport */}
        <div className="lg:col-span-2 rounded-2xl glass-panel border-cyan-500/30 overflow-hidden relative">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-slate-200">Interactive 3D WebGL Mesh</span>
          </div>

          <div className="absolute top-4 right-4 z-10 flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-cyan-400 inline-block" /> Healthy Store
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Stockout Risk
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-purple-500 inline-block" /> Wholesale Hub
            </span>
          </div>

          {/* Canvas Mount */}
          <div ref={mountRef} className="w-full h-[480px] cursor-grab active:cursor-grabbing" />

          <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Click any node in the 3D space to inspect store metrics & inventory vault</span>
            <span className="text-cyan-400">Indiranagar Cluster A &bull; 12.9716° N, 77.6412° E</span>
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        <div className="p-5 rounded-2xl glass-panel border-cyan-500/25 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              {selectedNode?.type === "MERCHANT_STORE" ? (
                <Store className="w-4 h-4 text-cyan-400" />
              ) : (
                <Truck className="w-4 h-4 text-purple-400" />
              )}
              <h3 className="text-sm font-bold text-slate-100">
                {selectedNode ? selectedNode.name : "Select a Node"}
              </h3>
            </div>
            {selectedNode && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  selectedNode.operating_status === "STOCKOUT_RISK"
                    ? "bg-rose-950 text-rose-300 border-rose-500/30"
                    : selectedNode.operating_status === "WARNING"
                    ? "bg-amber-950 text-amber-300 border-amber-500/30"
                    : "bg-emerald-950 text-emerald-300 border-emerald-500/30"
                }`}
              >
                {selectedNode.operating_status}
              </span>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-1 text-slate-400">
                {selectedNode.owner && (
                  <div>
                    <span className="text-slate-300 font-semibold">Owner:</span> {selectedNode.owner}
                  </div>
                )}
                <div>
                  <span className="text-slate-300 font-semibold">Address:</span> {selectedNode.address}
                </div>
                {selectedNode.phone && (
                  <div>
                    <span className="text-slate-300 font-semibold">Contact:</span> {selectedNode.phone}
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                {selectedNode.type === "MERCHANT_STORE" ? (
                  <>
                    <div>
                      <div className="text-[10px] text-slate-400">Critical Shortages</div>
                      <div className="text-sm font-bold text-rose-400 mt-0.5">
                        {selectedNode.metrics?.critical_shortages || 0} SKUs
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Demand Intensity</div>
                      <div className="text-sm font-bold text-cyan-400 mt-0.5">
                        {selectedNode.metrics?.demand_intensity || 0.5}x
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-[10px] text-slate-400">Lead Time</div>
                      <div className="text-sm font-bold text-purple-400 mt-0.5">
                        {selectedNode.metrics?.lead_time_hours} Hours
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Reliability</div>
                      <div className="text-sm font-bold text-emerald-400 mt-0.5">
                        {selectedNode.metrics?.reliability_rating} &starf;
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Store Private Inventory Items List */}
              {selectedNode.inventory_summary && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-slate-300 font-bold flex items-center justify-between">
                    <span>Stock Levels ({selectedNode.inventory_summary.length}):</span>
                    <span className="text-[10px] text-slate-500">Vault View</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {selectedNode.inventory_summary.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                      >
                        <span className="text-slate-300 truncate max-w-[150px]">{item.name}</span>
                        <div className="text-right">
                          <span
                            className={`font-bold ${
                              item.status === "CRITICAL"
                                ? "text-rose-400"
                                : item.status === "LOW"
                                ? "text-amber-400"
                                : item.status === "SURPLUS"
                                ? "text-emerald-400"
                                : "text-slate-200"
                            }`}
                          >
                            {item.stock} {item.unit}
                          </span>
                          <span className="text-[9px] text-slate-500 ml-1">({item.status})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500 font-mono text-xs">
              Click a store building or supplier depot in the 3D grid to view full telemetry.
            </div>
          )}
        </div>
      </div>

      {/* Coordination Supply Routes */}
      <div className="p-5 rounded-2xl glass-panel border-cyan-500/20 space-y-4">
        <h3 className="text-sm font-bold text-slate-200">Autonomous Coordination Logistics Routes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {twinState?.routes.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{r.commodity}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {r.status}
                </span>
              </div>
              <div className="text-slate-300">
                <span className="text-slate-500">Origin:</span> {r.origin_name} &rarr;{" "}
                <span className="text-slate-500">Delivery:</span> {r.destination_nodes.join(", ")}
              </div>
              <div className="text-emerald-400 text-[11px]">Consolidation: {r.savings_vs_individual}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

