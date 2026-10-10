"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Server,
  Radio,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Wifi,
  Cpu,
  Lock,
  ArrowUpRight,
  Zap,
} from "lucide-react";

interface ProbeTarget {
  name: string;
  url: string;
  ip: string;
  category: string;
  basePing: number;
  dnsTime: number;
  tcpTime: number;
  tlsTime: number;
  sslDays: number;
  sslIssuer: string;
  status: "UP" | "DEGRADED";
}

const MAJOR_TARGETS: ProbeTarget[] = [
  {
    name: "domain.vn",
    url: "https://domain.vn",
    ip: "103.20.144.15",
    category: "Cổng thông tin doanh nghiệp",
    basePing: 16,
    dnsTime: 1,
    tcpTime: 6,
    tlsTime: 9,
    sslDays: 280,
    sslIssuer: "GlobalSign nv-sa",
    status: "UP",
  },
  {
    name: "domain.com",
    url: "https://domain.com",
    ip: "104.21.50.88",
    category: "Website dịch vụ chính",
    basePing: 24,
    dnsTime: 2,
    tcpTime: 9,
    tlsTime: 13,
    sslDays: 180,
    sslIssuer: "DigiCert Global CA",
    status: "UP",
  },
  {
    name: "api.domain.vn",
    url: "https://api.domain.vn",
    ip: "103.20.144.20",
    category: "API Gateway máy chủ",
    basePing: 31,
    dnsTime: 2,
    tcpTime: 12,
    tlsTime: 17,
    sslDays: 159,
    sslIssuer: "DigiCert Root CA",
    status: "UP",
  },
  {
    name: "app.domain.com",
    url: "https://app.domain.com",
    ip: "172.67.180.45",
    category: "Nền tảng ứng dụng Web",
    basePing: 38,
    dnsTime: 3,
    tcpTime: 15,
    tlsTime: 20,
    sslDays: 110,
    sslIssuer: "Let's Encrypt Authority",
    status: "UP",
  },
  {
    name: "portal.domain.vn",
    url: "https://portal.domain.vn",
    ip: "103.20.144.32",
    category: "Hệ thống quản trị nội bộ",
    basePing: 19,
    dnsTime: 1,
    tcpTime: 7,
    tlsTime: 11,
    sslDays: 145,
    sslIssuer: "Sectigo RSA CA",
    status: "UP",
  },
];

export function SystemSimulationHero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentPing, setCurrentPing] = useState(16);
  const [probeCount, setProbeCount] = useState(14820);
  const [isPinging, setIsPinging] = useState(false);
  const [logHistory, setLogHistory] = useState<string[]>([
    "INIT: Monitoring Worker node [ONLINE]",
    "POLL: Probe cluster heartbeat 100% nominal",
    "PING: domain.vn (103.20.144.15) -> 16ms [HTTP 200 OK]",
  ]);

  const activeTarget = MAJOR_TARGETS[activeIndex];

  // Auto-cycle targets every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % MAJOR_TARGETS.length);
      setProbeCount((prev) => prev + 1);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  // Update ping and log on target change
  useEffect(() => {
    setIsPinging(true);
    const jitter = Math.floor((Math.sin(Date.now() / 1000) + 1) * 3);
    const measuredPing = activeTarget.basePing + jitter;
    setCurrentPing(measuredPing);

    const nowTime = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const newLog = `[${nowTime}] GET ${activeTarget.name} -> ${measuredPing}ms (DNS ${activeTarget.dnsTime}ms | TCP ${activeTarget.tcpTime}ms | TLS ${activeTarget.tlsTime}ms) [200 OK]`;
    setLogHistory((prev) => [newLog, prev[0], prev[1]].slice(0, 3));

    const timeout = setTimeout(() => {
      setIsPinging(false);
    }, 900);

    return () => clearTimeout(timeout);
  }, [activeIndex]);

  const handleSelectTarget = (index: number) => {
    setActiveIndex(index);
    setProbeCount((c) => c + 1);
  };

  return (
    <div className="relative mx-auto max-w-lg w-full bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 shadow-2xl shadow-blue-950/40 border border-slate-700/60 text-white overflow-hidden transition-all">
      {/* Decorative ambient gradient blooms */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Window Bar: Telemetry Header */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block shadow-xs" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block shadow-xs" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block shadow-xs" />
          <span className="ml-2 text-[11px] font-mono font-medium text-slate-400 tracking-tight">
            worker-telemetry.vibehost.internal
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2.5 py-1 rounded-full shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>LIVE PROBE ACTIVE</span>
        </div>
      </div>

      {/* Centerpiece: Animated Rotating Radar & Network Topology */}
      <div className="relative h-44 w-full bg-slate-950/80 rounded-2xl border border-slate-800/90 flex items-center justify-center overflow-hidden p-4 shadow-inner">
        {/* Radar Concentric Rings */}
        <div className="absolute w-36 h-36 rounded-full border border-blue-500/20" />
        <div className="absolute w-24 h-24 rounded-full border border-blue-500/30" />
        <div className="absolute w-12 h-12 rounded-full border border-blue-500/40" />

        {/* Radar Rotating Sweep Beam */}
        <div className="absolute w-36 h-36 rounded-full animate-spin [animation-duration:4s] pointer-events-none">
          <div className="w-1/2 h-1/2 bg-gradient-to-br from-blue-400/35 via-blue-500/10 to-transparent rounded-tl-full origin-bottom-right" />
        </div>

        {/* Crosshair grid lines */}
        <div className="absolute inset-x-4 h-px bg-slate-800/60" />
        <div className="absolute inset-y-4 w-px bg-slate-800/60" />

        {/* Center Node: Vibe Host Worker Engine */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/80 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 backdrop-blur-sm animate-pulse">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <span className="text-[10px] font-mono font-bold text-blue-300 mt-1.5 tracking-wider uppercase">
            Worker Core
          </span>
        </div>

        {/* Orbiting Major Target Nodes */}
        <div className="absolute top-3 left-4 flex items-center gap-1.5 text-[11px] font-mono bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-xs">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-200">domain.vn</span>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1 rounded border border-emerald-800/50">16ms</span>
        </div>

        <div className="absolute top-3 right-4 flex items-center gap-1.5 text-[11px] font-mono bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-xs">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-200">domain.com</span>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1 rounded border border-emerald-800/50">24ms</span>
        </div>

        <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-[11px] font-mono bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-xs">
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-200">api.domain.vn</span>
          <span className="text-[9px] font-mono text-blue-400 bg-blue-950/80 px-1 rounded border border-blue-800/50">31ms</span>
        </div>

        <div className="absolute bottom-3 right-4 flex items-center gap-1.5 text-[11px] font-mono bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-xs">
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-200">app.domain.com</span>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1 rounded border border-emerald-800/50">19ms</span>
        </div>
      </div>

      {/* Live Active Target Telemetry Panel */}
      <div className="mt-4 p-4 bg-slate-950/85 border border-slate-800 rounded-2xl shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-sm">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white font-mono tracking-tight">
                  {activeTarget.name}
                </span>
                <span className="text-[10px] font-mono text-slate-400">({activeTarget.ip})</span>
              </div>
              <span className="text-[11px] text-slate-400">{activeTarget.category}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className={`text-2xl font-extrabold font-mono transition-colors ${isPinging ? "text-emerald-300 scale-105" : "text-emerald-400"}`}>
                {currentPing}
              </span>
              <span className="text-xs text-slate-400 font-mono">ms</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center justify-end gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>HTTP 200 OK</span>
            </span>
          </div>
        </div>

        {/* Network Timing Breakdown Progress Bars */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[10px] font-mono">
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/90">
            <span className="text-slate-400 block text-[9px] uppercase tracking-wider">DNS Lookup</span>
            <span className="text-blue-400 font-bold text-xs mt-0.5 block">{activeTarget.dnsTime} ms</span>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-blue-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(15, activeTarget.dnsTime * 25))}%` }} />
            </div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/90">
            <span className="text-slate-400 block text-[9px] uppercase tracking-wider">TCP Connect</span>
            <span className="text-amber-400 font-bold text-xs mt-0.5 block">{activeTarget.tcpTime} ms</span>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(20, activeTarget.tcpTime * 5))}%` }} />
            </div>
          </div>
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/90">
            <span className="text-slate-400 block text-[9px] uppercase tracking-wider">TLS Handshake</span>
            <span className="text-emerald-400 font-bold text-xs mt-0.5 block">{activeTarget.tlsTime} ms</span>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(25, activeTarget.tlsTime * 4))}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Website Switcher Pills (Real Major Websites) */}
      <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {MAJOR_TARGETS.map((target, idx) => {
          const isSelected = idx === activeIndex;
          return (
            <button
              key={target.name}
              onClick={() => handleSelectTarget(idx)}
              className={`px-2.5 py-1.5 rounded-xl font-mono text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/25 border border-blue-400"
                  : "bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSelected ? "bg-white animate-ping" : "bg-emerald-400"
                }`}
              />
              <span>{target.name}</span>
            </button>
          );
        })}
      </div>

      {/* Terminal Log Stream Output */}
      <div className="mt-3 p-3 bg-black/70 rounded-xl border border-slate-900 text-[10px] font-mono text-slate-400 space-y-1">
        <div className="flex items-center justify-between text-slate-500 pb-1.5 border-b border-slate-800/80">
          <span className="text-[9px] tracking-wider uppercase text-slate-400">TELEMETRY STREAM LOG</span>
          <span className="text-slate-400">TỔNG LƯỢT PROBE: <strong suppressHydrationWarning>{new Intl.NumberFormat("en-US").format(probeCount)}</strong></span>
        </div>
        {logHistory.map((line, i) => (
          <p key={i} className={`truncate ${i === 0 ? "text-emerald-400 font-medium" : "text-slate-500"}`}>
            &gt; {line}
          </p>
        ))}
      </div>
    </div>
  );
}
