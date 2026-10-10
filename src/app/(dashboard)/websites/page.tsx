"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  MoreVertical,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  HelpCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SSLBadge } from "@/components/ui/SSLBadge";
import { WebsiteAvatar } from "@/components/ui/WebsiteAvatar";
import { EmptyState } from "@/components/ui/EmptyState";

interface WebsiteItem {
  id: string;
  name: string;
  url: string;
  status: string;
  displayStatus?: string;
  statusReason?: string;
  isStale?: boolean;
  currentState: string;
  lastResponseTime: number | null;
  lastHttpStatus: number | null;
  sslDaysRemaining: number | null;
  sslValid: boolean | null;
  lastCheckedAt: string | null;
  checkInterval: number;
}

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<WebsiteItem[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    up: 0,
    degraded: 0,
    down: 0,
    unknown: 0,
    paused: 0,
  });
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadWebsites = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (activeTab !== "ALL") query.set("status", activeTab);
      if (searchQuery.trim()) query.set("search", searchQuery.trim());

      const res = await fetch(`/api/websites?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setWebsites(json.data);
          if (json.counts) {
            setCounts(json.counts);
          }
        }
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWebsites();
    }, 200);
    return () => clearTimeout(timer);
  }, [activeTab, searchQuery]);

  // Real-time SSE subscription
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/realtime/events");
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (
            parsed.type?.startsWith("website.") ||
            parsed.type?.startsWith("worker.") ||
            parsed.type?.startsWith("incident.")
          ) {
            loadWebsites();
          }
        } catch {
          // Ignored
        }
      };
    } catch {
      // Ignored
    }
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [activeTab, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadWebsites();
  };

  const handleCheckNow = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActionMenuOpen(null);
    showToast("Đang thực hiện kiểm tra mạng thực tế...");
    try {
      const res = await fetch(`/api/websites/${id}/check`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        showToast(`Hoàn tất: HTTP ${json.data.result.httpStatus || 200} (${json.data.result.responseTimeMs}ms)`);
        loadWebsites();
      } else {
        showToast(`Lỗi: ${json.message}`);
      }
    } catch {
      showToast("Lỗi khi gửi yêu cầu kiểm tra");
    }
  };

  const handleTogglePause = async (id: string, currentState: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActionMenuOpen(null);
    const endpoint = currentState === "PAUSED" ? `/api/websites/${id}/resume` : `/api/websites/${id}/pause`;
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        showToast(currentState === "PAUSED" ? "Đã tiếp tục giám sát" : "Đã tạm dừng giám sát");
        loadWebsites();
      }
    } catch {
      showToast("Thao tác thất bại");
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa website này khỏi danh sách giám sát?")) return;
    setActionMenuOpen(null);
    try {
      const res = await fetch(`/api/websites/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("Đã xóa website");
        loadWebsites();
      }
    } catch {
      showToast("Lỗi khi xóa website");
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(websites.map((w) => w.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const tabs = [
    { key: "ALL", label: "Tất cả", count: counts.all },
    { key: "UP", label: "Hoạt động", count: counts.up },
    { key: "DEGRADED", label: "Cảnh báo", count: counts.degraded },
    { key: "DOWN", label: "Gặp lỗi", count: counts.down },
    { key: "UNKNOWN", label: "Không xác định", count: counts.unknown },
    { key: "PAUSED", label: "Tạm dừng", count: counts.paused },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Danh sách website</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi trạng thái vận hành và chứng chỉ SSL dựa trên kết quả kiểm tra thực tế
          </p>
        </div>
        <Link
          href="/websites/new"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm website</span>
        </Link>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc URL..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </form>
      </div>

      {/* Bulk Action Bar if selection exists */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
          <span>Đã chọn <b>{selectedIds.length}</b> website</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="saas-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Đang tải dữ liệu website...</div>
        ) : websites.length === 0 ? (
          <EmptyState
            title="Không tìm thấy website nào"
            description="Chưa có website nào khớp với điều kiện lọc hiện tại."
            actionText="Thêm website mới"
            actionHref="/websites/new"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === websites.length && websites.length > 0}
                      onChange={handleSelectAll}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-3.5 px-3">Website</th>
                  <th className="py-3.5 px-3">Trạng thái</th>
                  <th className="py-3.5 px-3">Phản hồi</th>
                  <th className="py-3.5 px-3">SSL</th>
                  <th className="py-3.5 px-3">Lần kiểm tra cuối</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {websites.map((site) => {
                  const isSelected = selectedIds.includes(site.id);
                  const isMenuOpen = actionMenuOpen === site.id;
                  const displayStatus = site.displayStatus || site.status;

                  return (
                    <tr
                      key={site.id}
                      className={`hover:bg-slate-50/70 transition ${isSelected ? "bg-blue-50/40" : ""}`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(site.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <WebsiteAvatar name={site.name} size="sm" />
                          <div className="min-w-0">
                            <Link
                              href={`/websites/${site.id}`}
                              className="font-medium text-slate-900 hover:text-blue-600 transition block truncate"
                            >
                              {site.name}
                            </Link>
                            <span className="text-xs text-slate-400 block truncate">{site.url}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-0.5">
                          <StatusBadge status={displayStatus} />
                          {site.statusReason && (
                            <span className="text-[10px] text-slate-500 max-w-[180px] truncate">
                              {site.statusReason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
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
                      <td className="py-3 px-3">
                        <SSLBadge daysRemaining={site.sslDaysRemaining} sslValid={site.sslValid} />
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">
                        {site.lastCheckedAt ? (
                          <div>
                            <p className="font-medium text-slate-700">
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
                          <span className="italic text-slate-400">Chưa kiểm tra</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => handleCheckNow(site.id, e)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Kiểm tra ngay"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setActionMenuOpen(isMenuOpen ? null : site.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {isMenuOpen && (
                              <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                                <Link
                                  href={`/websites/${site.id}`}
                                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Xem chi tiết</span>
                                </Link>
                                <button
                                  onClick={(e) => handleTogglePause(site.id, site.currentState, e)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                                >
                                  {site.currentState === "PAUSED" ? (
                                    <>
                                      <Play className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>Tiếp tục theo dõi</span>
                                    </>
                                  ) : (
                                    <>
                                      <Pause className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Tạm dừng theo dõi</span>
                                    </>
                                  )}
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button
                                  onClick={(e) => handleDelete(site.id, e)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Xóa website</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
