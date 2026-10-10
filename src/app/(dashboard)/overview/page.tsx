"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  MoreVertical,
  Activity,
  Server,
  Radio,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SSLBadge } from "@/components/ui/SSLBadge";
import { WebsiteAvatar } from "@/components/ui/WebsiteAvatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface StatsData {
  worker: {
    isActive: boolean;
    lastHeartbeatAt: string | null;
    activeJobs: number;
    queueDepth: number;
    workerStatus: string;
  };
  counts: {
    total: number;
    up: number;
    degraded: number;
    down: number;
    unknown: number;
    paused: number;
    avgUptime: number | null;
    totalChecks: number;
  };
  recentWebsites: Array<{
    id: string;
    name: string;
    url: string;
    status: string;
    statusReason?: string;
    isStale?: boolean;
    lastResponseTime: number | null;
    lastHttpStatus: number | null;
    sslDaysRemaining: number | null;
    sslValid: boolean | null;
    lastCheckedAt: string | null;
    nextCheckAt?: string | null;
  }>;
  recentNotifications: Array<{
    id: string;
    eventType: string;
    messageBody: string;
    sentAt: string;
    website: { name: string; url: string };
  }>;
  timelineData: Array<{
    date: string;
    online: number;
    warning: number;
    down: number;
    totalChecks: number;
  }>;
  lastUpdated: string;
}

export default function OverviewPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);

  const fetchStats = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      }
    } catch {
      // Network failure
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // 1. Setup Server-Sent Events for live worker check updates
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/realtime/events");
      eventSource.onopen = () => setSseConnected(true);
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (
            parsed.type?.startsWith("website.") ||
            parsed.type?.startsWith("worker.") ||
            parsed.type?.startsWith("incident.")
          ) {
            fetchStats();
          }
        } catch {
          // Ignore parse errors
        }
      };
      eventSource.onerror = () => {
        setSseConnected(false);
      };
    } catch {
      setSseConnected(false);
    }

    // 2. Fallback polling every 20 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 20000);

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, []);

  const total = data?.counts.total ?? 0;
  const up = data?.counts.up ?? 0;
  const degraded = data?.counts.degraded ?? 0;
  const down = data?.counts.down ?? 0;
  const unknown = data?.counts.unknown ?? 0;
  const workerActive = data?.worker.isActive ?? false;

  // Donut chart distribution (only non-zero slices)
  const donutData = [
    { name: "Hoạt động", value: up, color: "#10b981" },
    { name: "Cảnh báo", value: degraded, color: "#f59e0b" },
    { name: "Gặp lỗi", value: down, color: "#ef4444" },
    { name: "Không xác định", value: unknown, color: "#94a3b8" },
  ].filter((d) => d.value > 0);

  const lastUpdatedFormatted = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Đang tải...";

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Worker Health & Staleness Audit */}
      <div
        className={`px-4 py-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
          workerActive
            ? "bg-emerald-50/60 border-emerald-200/80 text-emerald-900"
            : "bg-rose-50 border-rose-200 text-rose-900"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                workerActive ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                workerActive ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
          </span>
          <div>
            <span className="font-bold">
              {workerActive ? "Monitoring Worker: Đang chạy" : "Monitoring Worker: Gián đoạn kết nối"}
            </span>
            <span className="mx-1.5 opacity-60">•</span>
            <span className="opacity-80">
              {data?.worker.lastHeartbeatAt
                ? `Heartbeat cuối: ${new Date(data.worker.lastHeartbeatAt).toLocaleTimeString("vi-VN")}`
                : "Chưa ghi nhận heartbeat"}
            </span>
            {sseConnected && (
              <span className="ml-2 inline-flex items-center gap-1 font-medium text-emerald-700 bg-white/70 px-1.5 py-0.5 rounded text-[10px]">
                <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                Realtime SSE
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] opacity-90">
          <span>Tiến trình xử lý: <strong>{data?.worker.activeJobs ?? 0}</strong></span>
          <span>Hàng đợi: <strong>{data?.worker.queueDepth ?? 0}</strong></span>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tổng quan giám sát</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <span>Dữ liệu worker ghi nhận lúc {lastUpdatedFormatted}</span>
            <button
              onClick={() => fetchStats(true)}
              className="text-slate-400 hover:text-blue-600 transition p-1 rounded hover:bg-slate-100"
              title="Làm mới dữ liệu từ Worker"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/websites/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <span>+ Thêm website</span>
          </Link>
        </div>
      </div>

      {/* Onboarding Welcome Card when zero websites */}
      {total === 0 && !loading && (
        <div className="saas-card p-6 sm:p-8 border-2 border-dashed border-blue-200 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-white text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Chào mừng bạn đến với Canh Gác Website!</h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Tài khoản đã sẵn sàng hoạt động. Hãy thêm tên miền hoặc website của bạn để hệ thống bắt đầu đo đạc Uptime HTTP, kiểm tra chứng chỉ SSL và giám sát an ninh 24/7.
          </p>
          <div className="pt-2">
            <Link
              href="/websites/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition"
            >
              <span>+ Thêm website đầu tiên ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 5 KPI Cards: Total, Up, Degraded, Down, Unknown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total */}
        <div className="saas-card saas-card-hover p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tổng website</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{total}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {data?.counts.totalChecks ? `${data.counts.totalChecks} lượt kiểm tra` : "Chưa có kiểm tra"}
          </p>
        </div>

        {/* Card 2: UP */}
        <div className="saas-card saas-card-hover p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hoạt động</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{up}</span>
            {total > 0 && (
              <span className="text-xs text-slate-400 font-medium">
                ({((up / total) * 100).toFixed(0)}%)
              </span>
            )}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Phản hồi đạt chuẩn</p>
        </div>

        {/* Card 3: Degraded */}
        <div className="saas-card saas-card-hover p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cảnh báo</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{degraded}</span>
            {total > 0 && (
              <span className="text-xs text-slate-400 font-medium">
                ({((degraded / total) * 100).toFixed(0)}%)
              </span>
            )}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Phản hồi chậm</p>
        </div>

        {/* Card 4: Down */}
        <div className="saas-card saas-card-hover p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gặp lỗi</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{down}</span>
            {total > 0 && (
              <span className="text-xs text-slate-400 font-medium">
                ({((down / total) * 100).toFixed(0)}%)
              </span>
            )}
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-1">Không phản hồi</p>
        </div>

        {/* Card 5: Unknown / Stale (Vital honesty requirement) */}
        <div className="saas-card saas-card-hover p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Không xác định</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{unknown}</span>
            {total > 0 && (
              <span className="text-xs text-slate-400 font-medium">
                ({((unknown / total) * 100).toFixed(0)}%)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Chưa có kết quả mới</p>
        </div>
      </div>

      {/* Charts Section: Actual Stacked Timeline Bar Chart & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Stacked Timeline Bar Chart (8 cols) */}
        <div className="lg:col-span-8 saas-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Nhật ký kiểm tra 7 ngày qua</h3>
              <p className="text-xs text-slate-500">
                Tổng hợp lượt kiểm tra từ Monitoring Worker (Database thật)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Đạt chuẩn
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Chậm
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Thất bại
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {data?.timelineData && data.timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "10px",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                      padding: "8px 12px",
                    }}
                  />
                  <Bar dataKey="online" name="Đạt chuẩn" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="warning" name="Chậm" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="down" name="Thất bại" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Chưa có dữ liệu kiểm tra trong 7 ngày qua
              </div>
            )}
          </div>
        </div>

        {/* Right: Status Donut Chart (4 cols) */}
        <div className="lg:col-span-4 saas-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Phân bổ trạng thái</h3>
            <Link href="/websites" className="text-xs text-blue-600 font-semibold hover:underline">
              Xem tất cả
            </Link>
          </div>

          <div className="relative h-48 w-full flex items-center justify-center">
            {total > 0 && donutData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value} website`, name]}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "10px",
                        border: "none",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900">{total}</span>
                  <span className="text-[11px] text-slate-400 font-medium">Website</span>
                </div>
              </>
            ) : (
              <div className="text-center text-xs text-slate-400 py-12">
                Chưa có website nào được đăng ký
              </div>
            )}
          </div>

          <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
            {donutData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </span>
                <span className="font-semibold text-slate-900">
                  {item.value}{" "}
                  <span className="text-slate-400 font-normal">
                    ({((item.value / total) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Websites & Latest Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Websites Table (8 cols) */}
        <div className="lg:col-span-8 saas-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Danh sách website gần đây</h3>
              <p className="text-xs text-slate-500">Trạng thái được worker xác nhận</p>
            </div>
            <Link
              href="/websites"
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Website</th>
                  <th className="py-3 px-2">Trạng thái</th>
                  <th className="py-3 px-2">Phản hồi</th>
                  <th className="py-3 px-2">SSL</th>
                  <th className="py-3 px-2">Kiểm tra lần cuối</th>
                  <th className="py-3 px-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {data?.recentWebsites && data.recentWebsites.length > 0 ? (
                  data.recentWebsites.map((site) => (
                    <tr key={site.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <WebsiteAvatar name={site.name} size="sm" />
                          <div>
                            <Link
                              href={`/websites/${site.id}`}
                              className="font-medium text-slate-900 hover:text-blue-600 transition"
                            >
                              {site.name}
                            </Link>
                            <p className="text-xs text-slate-400 truncate max-w-xs">{site.url}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col gap-0.5">
                          <StatusBadge status={site.status} />
                          {site.statusReason && (
                            <span className="text-[10px] text-slate-500 truncate max-w-[160px]">
                              {site.statusReason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-slate-600 font-medium">
                        {site.lastResponseTime && site.lastResponseTime > 0 ? (
                          <div className="flex flex-col">
                            <span>{site.lastResponseTime.toLocaleString()} ms</span>
                            {site.lastHttpStatus && (
                              <span className="text-[10px] text-slate-400">
                                HTTP {site.lastHttpStatus}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <SSLBadge daysRemaining={site.sslDaysRemaining} sslValid={site.sslValid} />
                      </td>
                      <td className="py-3 px-2 text-xs text-slate-500">
                        {site.lastCheckedAt ? (
                          <div>
                            <p className="text-slate-700 font-medium">
                              {new Date(site.lastCheckedAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(site.lastCheckedAt).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa kiểm tra</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Link
                          href={`/websites/${site.id}`}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg inline-block"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      Chưa có website nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Latest Alerts Feed (4 cols) */}
        <div className="lg:col-span-4 saas-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Cảnh báo ghi nhận</h3>
              <p className="text-xs text-slate-500">Thông báo từ sự cố thực tế</p>
            </div>
            <Link
              href="/alerts"
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {data?.recentNotifications && data.recentNotifications.length > 0 ? (
              data.recentNotifications.map((notif) => {
                const isDown = notif.eventType === "DOWN";
                const isRecovery = notif.eventType === "RECOVERY";
                const isSSL = notif.eventType === "SSL_WARNING";

                return (
                  <div
                    key={notif.id}
                    className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {isDown ? (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        ) : isRecovery ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : isSSL ? (
                          <Lock className="w-4 h-4 text-amber-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {isDown
                            ? "Website gặp lỗi"
                            : isRecovery
                            ? "Đã phục hồi hoạt động"
                            : isSSL
                            ? "SSL sắp hết hạn"
                            : "Cảnh báo hệ thống"}
                        </p>
                        <p className="text-xs text-slate-600 truncate mt-0.5">{notif.website.name}</p>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(notif.sentAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>• Telegram</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Chưa có cảnh báo nào được gửi
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
