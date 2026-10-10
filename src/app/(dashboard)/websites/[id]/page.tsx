"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  Pause,
  Play,
  Settings,
  ExternalLink,
  Shield,
  Clock,
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  History,
  ShieldAlert,
  Sliders,
  Trash2,
  Server,
  Zap,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SSLBadge } from "@/components/ui/SSLBadge";
import { WebsiteAvatar } from "@/components/ui/WebsiteAvatar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface WebsiteDetailData {
  id: string;
  name: string;
  url: string;
  status: string;
  displayStatus?: string;
  statusReason?: string;
  isStale?: boolean;
  currentState: string;
  checkInterval: number;
  expectedStatusCode: number;
  expectedKeyword: string | null;
  responseThresholdMs: number;
  lastResponseTime: number | null;
  lastHttpStatus: number | null;
  uptime7d: number | null;
  totalChecks7d: number;
  sslValid: boolean | null;
  sslIssuer: string | null;
  sslExpirationDate: string | null;
  sslDaysRemaining: number | null;
  lastCheckedAt: string | null;
  nextCheckAt: string | null;
  worker?: {
    isActive: boolean;
    lastHeartbeatAt: string | null;
  };
  latestCheckLog?: {
    checkedAt: string;
    httpStatus: number | null;
    responseTimeMs: number;
    dnsTimeMs: number | null;
    connectTimeMs: number | null;
    tlsTimeMs: number | null;
    ipAddress: string | null;
    contentLength: number | null;
    isSuccessful: boolean;
    errorMessage: string | null;
  } | null;
  incidents: Array<{
    id: string;
    startedAt: string;
    resolvedAt: string | null;
    durationSeconds: number | null;
    cause: string;
    status: string;
  }>;
  securityScans: Array<{
    id: string;
    scannedAt: string;
    htmlHash: string | null;
    pageTitle: string | null;
    metaDescription: string | null;
    hasAnomaly: boolean;
    titleChanged: boolean;
    metaChanged: boolean;
    suspiciousTagsFound: string | null;
    suspiciousLinks: string | null;
    details: string | null;
  }>;
}

export default function WebsiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [website, setWebsite] = useState<WebsiteDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("7d");
  const [chartLogs, setChartLogs] = useState<any[]>([]);
  const [recentChecks, setRecentChecks] = useState<any[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadWebsite = async () => {
    try {
      const res = await fetch(`/api/websites/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setWebsite(json.data);
        }
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const loadChecks = async (range = timeRange) => {
    try {
      const res = await fetch(`/api/websites/${id}/checks?range=${range}&limit=50`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setChartLogs(json.data.chartData);
          setRecentChecks(json.data.logs);
        }
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    if (id) {
      loadWebsite();
      loadChecks();
    }
  }, [id]);

  const handleCheckNow = async () => {
    setIsChecking(true);
    showToast("Đang kích hoạt lượt kiểm tra mạng thực tế...");
    try {
      const res = await fetch(`/api/websites/${id}/check`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        const result = json.data.result;
        showToast(`Kiểm tra hoàn tất: HTTP ${result.httpStatus || 200} (${result.responseTimeMs}ms)`);
        await loadWebsite();
        await loadChecks();
      } else {
        showToast(`Lỗi: ${json.message}`);
      }
    } catch {
      showToast("Lỗi kết nối khi gửi yêu cầu kiểm tra");
    } finally {
      setIsChecking(false);
    }
  };

  const handleTogglePause = async () => {
    if (!website) return;
    const isPaused = website.currentState === "PAUSED";
    const endpoint = isPaused ? `/api/websites/${id}/resume` : `/api/websites/${id}/pause`;
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        showToast(isPaused ? "Đã tiếp tục giám sát website" : "Đã tạm dừng giám sát");
        loadWebsite();
      }
    } catch {
      showToast("Lỗi thao tác");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa website này khỏi hệ thống?")) return;
    try {
      const res = await fetch(`/api/websites/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        router.push("/websites");
      }
    } catch {
      showToast("Lỗi khi xóa website");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Đang tải dữ liệu từ cơ sở dữ liệu...</div>;
  }

  if (!website) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p>Không tìm thấy thông tin website.</p>
        <Link href="/websites" className="text-blue-600 hover:underline mt-2 inline-block">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const tabs = [
    { key: "overview", label: "Tổng quan & Bằng chứng", icon: Activity },
    { key: "checks", label: "Nhật ký kiểm tra", icon: History },
    { key: "incidents", label: "Sự cố", icon: AlertTriangle },
    { key: "ssl", label: "Chứng chỉ SSL", icon: Lock },
    { key: "security", label: "An ninh", icon: ShieldAlert },
    { key: "settings", label: "Cấu hình", icon: Sliders },
  ];

  const currentDisplayStatus = website.displayStatus || website.status;

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/websites" className="hover:text-slate-900 transition flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Danh sách website</span>
        </Link>
        <span>&gt;</span>
        <span className="font-semibold text-slate-900">{website.name}</span>
      </div>

      {/* Website Header Card */}
      <div className="saas-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <WebsiteAvatar name={website.name} size="lg" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{website.name}</h1>
              <StatusBadge status={currentDisplayStatus} />
            </div>
            {website.statusReason && (
              <p className="text-xs text-slate-500 mt-1 font-medium">{website.statusReason}</p>
            )}
            <a
              href={website.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-blue-600 transition flex items-center gap-1 mt-1"
            >
              <span>{website.url}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCheckNow}
            disabled={isChecking}
            className="px-3.5 py-2 bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
            <span>Kiểm tra ngay</span>
          </button>
          <button
            onClick={handleTogglePause}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            {website.currentState === "PAUSED" ? (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tiếp tục</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-600" />
                <span>Tạm dừng</span>
              </>
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition"
            title="Cấu hình website"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 KPI Cards: Honest Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Response Time */}
        <div className="saas-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Thời gian phản hồi
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold ${
                website.lastResponseTime && website.lastResponseTime > 2000
                  ? "text-amber-600"
                  : "text-slate-900"
              }`}
            >
              {website.lastResponseTime && website.lastResponseTime > 0
                ? `${website.lastResponseTime.toLocaleString()} ms`
                : "—"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {website.lastHttpStatus ? `HTTP ${website.lastHttpStatus}` : "Chưa có lượt kiểm tra"}
          </p>
        </div>

        {/* KPI 2: Uptime 7d (No fake numbers!) */}
        <div className="saas-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Uptime 7 ngày
          </span>
          <div className="flex items-baseline gap-2">
            {website.uptime7d !== null ? (
              <span className="text-2xl font-extrabold text-emerald-600">{website.uptime7d}%</span>
            ) : (
              <span className="text-2xl font-bold text-slate-400">Chưa đủ dữ liệu</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Dựa trên {website.totalChecks7d} lượt kiểm tra
          </p>
        </div>

        {/* KPI 3: SSL */}
        <div className="saas-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Chứng chỉ SSL
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold ${
                website.sslDaysRemaining && website.sslDaysRemaining <= 15
                  ? "text-amber-600"
                  : "text-slate-900"
              }`}
            >
              {website.sslDaysRemaining !== null
                ? `Còn ${website.sslDaysRemaining} ngày`
                : "Chưa kiểm tra"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {website.sslValid === true ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Chứng chỉ hợp lệ
              </span>
            ) : website.sslValid === false ? (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Cảnh báo chứng chỉ
              </span>
            ) : (
              "Chưa quét chứng chỉ"
            )}
          </p>
        </div>

        {/* KPI 4: Last Checked */}
        <div className="saas-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Kiểm tra lần cuối
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {website.lastCheckedAt
                ? new Date(website.lastCheckedAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "—"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {website.lastCheckedAt
              ? new Date(website.lastCheckedAt).toLocaleDateString("vi-VN")
              : "Đang chờ worker thực hiện"}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Monitoring Evidence Transparency */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Transparency Evidence Card (Requirement 17 & 31) */}
          <div className="saas-card p-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Server className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Bằng chứng giám sát kỹ thuật (Monitoring Evidence)</h3>
                  <p className="text-[11px] text-slate-500">Dữ liệu telemetry probe thực tế từ worker</p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Nguồn: Monitoring Worker
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Trạng thái Worker</span>
                <span className="text-slate-900 font-bold text-sm mt-1 flex items-center gap-1.5">
                  {website.worker?.isActive ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-emerald-700 font-bold">Đang hoạt động</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="text-rose-600 font-bold">Mất kết nối</span>
                    </>
                  )}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {website.worker?.lastHeartbeatAt
                    ? `Heartbeat: ${new Date(website.worker.lastHeartbeatAt).toLocaleTimeString("vi-VN")}`
                    : "Không có heartbeat"}
                </span>
              </div>

              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Mã phản hồi HTTP</span>
                <span className="text-emerald-600 font-bold text-sm mt-1 block">
                  {website.latestCheckLog?.httpStatus
                    ? `HTTP ${website.latestCheckLog.httpStatus}`
                    : website.lastHttpStatus
                    ? `HTTP ${website.lastHttpStatus}`
                    : "Chưa ghi nhận"}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                  {website.latestCheckLog?.ipAddress ? `IP: ${website.latestCheckLog.ipAddress}` : "DNS: N/A"}
                </span>
              </div>

              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Tổng thời gian phản hồi</span>
                <span className="text-blue-600 font-bold text-sm mt-1 block">
                  {website.latestCheckLog?.responseTimeMs ?? website.lastResponseTime ?? "—"} ms
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Dung lượng: {website.latestCheckLog?.contentLength ? `${(website.latestCheckLog.contentLength / 1024).toFixed(1)} KB` : "—"}
                </span>
              </div>

              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Chu kỳ & Lượt tiếp theo</span>
                <span className="text-slate-900 font-bold text-sm mt-1 block">
                  {website.checkInterval / 60} phút / lần
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {website.nextCheckAt
                    ? `Tiếp theo: ${new Date(website.nextCheckAt).toLocaleTimeString("vi-VN")}`
                    : "Chưa lập lịch"}
                </span>
              </div>
            </div>

            {/* Network breakdown if available */}
            {website.latestCheckLog && (
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">DNS Lookup:</span>
                  <span className="text-blue-600 font-bold">{website.latestCheckLog.dnsTimeMs ?? 0} ms</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">TCP Connect:</span>
                  <span className="text-amber-600 font-bold">{website.latestCheckLog.connectTimeMs ?? 0} ms</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">TLS Handshake:</span>
                  <span className="text-emerald-600 font-bold">{website.latestCheckLog.tlsTimeMs ?? 0} ms</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Tổng phản hồi:</span>
                  <span className="text-slate-900 font-bold">{website.latestCheckLog.responseTimeMs} ms</span>
                </div>
              </div>
            )}
          </div>

          {/* Performance Chart */}
          <div className="saas-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Biểu đồ thời gian phản hồi ({timeRange} qua)</h3>
                <p className="text-xs text-slate-500">Được ghi nhận từ các lượt HTTP probe thực tế</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {["1h", "6h", "24h", "7d", "30d"].map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setTimeRange(r);
                      loadChecks(r);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      timeRange === r
                        ? "bg-white text-blue-600 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-72 w-full">
              {chartLogs.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartLogs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit="ms" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "10px",
                        border: "none",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      formatter={(val: number) => [`${val} ms`, "Thời gian phản hồi"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 2, fill: "#2563eb" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Chưa có dữ liệu kiểm tra trong khoảng thời gian này
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: HTTP Checks Table */}
      {activeTab === "checks" && (
        <div className="saas-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Lịch sử lượt kiểm tra HTTP thực tế</h3>
            <span className="text-xs text-slate-400">Hiển thị tối đa 50 lượt gần nhất</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-3">Mã HTTP</th>
                  <th className="py-3 px-3">Phản hồi</th>
                  <th className="py-3 px-3">DNS / Connect / TLS</th>
                  <th className="py-3 px-3">Kết quả</th>
                  <th className="py-3 px-4">Thông điệp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentChecks.length > 0 ? (
                  recentChecks.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {new Date(log.checkedAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold ${
                            log.httpStatus === 200
                              ? "bg-emerald-50 text-emerald-700"
                              : log.httpStatus >= 500
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {log.httpStatus || "ERR"}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{log.responseTimeMs} ms</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {log.dnsTimeMs ?? "—"} / {log.connectTimeMs ?? "—"} / {log.tlsTimeMs ?? "—"} ms
                      </td>
                      <td className="py-3 px-3">
                        {log.isSuccessful ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Thành công
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                            <XCircle className="w-3.5 h-3.5" /> Thất bại
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {log.errorMessage || "Hoạt động bình thường"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      Chưa có lượt kiểm tra nào được ghi nhận
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Incidents */}
      {activeTab === "incidents" && (
        <div className="saas-card overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Lịch sử sự cố ghi nhận</h3>
          </div>
          {website.incidents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Không có sự cố nào được ghi nhận trên website này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Bắt đầu</th>
                    <th className="py-3 px-3">Kết thúc</th>
                    <th className="py-3 px-3">Thời lượng</th>
                    <th className="py-3 px-4">Nguyên nhân</th>
                    <th className="py-3 px-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {website.incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {new Date(inc.startedAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString("vi-VN") : "Đang diễn ra"}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {inc.durationSeconds ? `${Math.round(inc.durationSeconds / 60)} phút` : "—"}
                      </td>
                      <td className="py-3 px-4 font-mono text-rose-600">{inc.cause}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium ${
                            inc.status === "RESOLVED"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700 animate-pulse"
                          }`}
                        >
                          {inc.status === "RESOLVED" ? "Đã khắc phục" : "Đang diễn ra"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: SSL Certificate */}
      {activeTab === "ssl" && (
        <div className="saas-card p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 mb-2">Chi tiết chứng chỉ TLS/SSL thực tế</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium">Đơn vị phát hành (Issuer)</span>
              <p className="font-semibold text-slate-900 text-sm">{website.sslIssuer || "Chưa có dữ liệu"}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium">Thời hạn còn lại</span>
              <p className="font-semibold text-slate-900 text-sm">
                {website.sslDaysRemaining !== null ? `${website.sslDaysRemaining} ngày` : "Chưa kiểm tra"}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium">Ngày hết hạn</span>
              <p className="font-semibold text-slate-900 text-sm">
                {website.sslExpirationDate
                  ? new Date(website.sslExpirationDate).toLocaleDateString("vi-VN")
                  : "Chưa có"}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium">Trạng thái xác thực</span>
              <p className="font-semibold text-sm">
                {website.sslValid === true ? (
                  <span className="text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Chứng chỉ hợp lệ và tin cậy
                  </span>
                ) : website.sslValid === false ? (
                  <span className="text-rose-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Chứng chỉ không hợp lệ hoặc đã hết hạn
                  </span>
                ) : (
                  <span className="text-slate-500">Chưa kiểm tra</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Security / Anomaly Scans */}
      {activeTab === "security" && (
        <div className="saas-card p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 mb-2">Phát hiện bất thường & Quét an ninh</h3>
          {website.securityScans.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Chưa có dữ liệu kiểm tra an ninh. Bấm &quot;Kiểm tra ngay&quot; để thực hiện quét trang.
            </div>
          ) : (
            <div className="space-y-4">
              {website.securityScans.map((scan) => (
                <div key={scan.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      Lần quét: {new Date(scan.scannedAt).toLocaleString("vi-VN")}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium flex items-center gap-1 text-[11px] ${
                        scan.hasAnomaly ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {scan.hasAnomaly ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Có thay đổi nội dung</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Bình thường</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-600">
                    <div>
                      <span className="font-medium text-slate-400">Tiêu đề (Title):</span>{" "}
                      <span className="font-semibold text-slate-800">{scan.pageTitle || "N/A"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-400">Thay đổi tiêu đề:</span>{" "}
                      {scan.titleChanged ? "Có" : "Không"}
                    </div>
                    <div>
                      <span className="font-medium text-slate-400">Thẻ Meta:</span>{" "}
                      <span className="text-slate-800">{scan.metaDescription || "N/A"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-400">Thay đổi meta:</span>{" "}
                      {scan.metaChanged ? "Có" : "Không"}
                    </div>
                  </div>
                  {scan.details && (
                    <div className="p-2.5 bg-amber-50 rounded-lg text-amber-800 text-[11px] border border-amber-200">
                      {scan.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Settings */}
      {activeTab === "settings" && (
        <div className="saas-card p-6 space-y-6">
          <h3 className="text-base font-bold text-slate-900">Cấu hình thông số giám sát</h3>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên định danh</label>
              <input
                type="text"
                defaultValue={website.name}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                disabled
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">URL giám sát</label>
              <input
                type="text"
                defaultValue={website.url}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                disabled
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chu kỳ kiểm tra</label>
              <input
                type="text"
                defaultValue={`${website.checkInterval / 60} phút`}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                disabled
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-rose-700">Xóa website khỏi hệ thống</h4>
              <p className="text-[11px] text-slate-400">Xóa toàn bộ dữ liệu kiểm tra và lịch sử sự cố.</p>
            </div>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa website</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
