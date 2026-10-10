"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, AlertOctagon, CheckCircle2, Clock, Eye, Filter, X } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

interface IncidentItem {
  id: string;
  websiteId: string;
  startedAt: string;
  resolvedAt: string | null;
  durationSeconds: number | null;
  cause: string;
  status: string;
  website: {
    id: string;
    name: string;
    url: string;
  };
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter !== "ALL") query.set("status", statusFilter);
      if (search.trim()) query.set("search", search.trim());

      const res = await fetch(`/api/incidents?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setIncidents(json.data);
        }
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [statusFilter]);

  const viewIncidentDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSelectedIncident(json.data);
        }
      }
    } catch {
      // Ignored
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lịch sử sự cố</h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi và phân tích toàn bộ các đợt gián đoạn dịch vụ của hệ thống website
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="OPEN">Đang diễn ra</option>
            <option value="RESOLVED">Đã khắc phục</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadIncidents()}
            placeholder="Tìm theo website hoặc nguyên nhân..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Incidents Table */}
      <div className="saas-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Đang tải lịch sử sự cố...</div>
        ) : incidents.length === 0 ? (
          <EmptyState
            title="Tuyệt vời! Không có sự cố nào được ghi nhận"
            description="Tất cả các website của bạn đang hoạt động bình thường mà không gặp gián đoạn nào."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Website</th>
                  <th className="py-3.5 px-3">Bắt đầu</th>
                  <th className="py-3.5 px-3">Kết thúc</th>
                  <th className="py-3.5 px-3">Thời lượng</th>
                  <th className="py-3.5 px-4">Nguyên nhân</th>
                  <th className="py-3.5 px-3">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {incidents.map((inc) => {
                  const isResolved = inc.status === "RESOLVED";
                  const durationMinutes = inc.durationSeconds
                    ? Math.round(inc.durationSeconds / 60)
                    : null;

                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <Link
                          href={`/websites/${inc.website.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 transition"
                        >
                          {inc.website.name}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">
                        {new Date(inc.startedAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">
                        {inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString("vi-VN") : "Đang diễn ra"}
                      </td>
                      <td className="py-3 px-3 text-xs font-semibold text-slate-700">
                        {durationMinutes ? `${durationMinutes} phút` : "—"}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-rose-600">
                        {inc.cause}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            isResolved
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isResolved ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          <span>{isResolved ? "Đã khắc phục" : "Đang diễn ra"}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => viewIncidentDetails(inc.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Xem timeline sự cố"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Chi tiết sự cố</h3>
                <p className="text-xs text-slate-400">
                  Mã sự cố: #{selectedIncident.id.slice(-7).toUpperCase()} • {selectedIncident.website.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block mb-0.5">Nguyên nhân</span>
                <span className="font-bold text-rose-600">{selectedIncident.cause}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Thời lượng downtime</span>
                <span className="font-bold text-slate-800">
                  {selectedIncident.durationSeconds
                    ? `${Math.round(selectedIncident.durationSeconds / 60)} phút`
                    : "Đang diễn ra"}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Dòng thời gian sự cố (Timeline)
              </h4>
              <div className="space-y-3 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {selectedIncident.timeline?.map((item: any, idx: number) => (
                  <div key={idx} className="relative text-xs">
                    <span
                      className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-white ring-1 ${
                        item.type === "DANGER"
                          ? "bg-rose-500 ring-rose-300"
                          : item.type === "SUCCESS"
                          ? "bg-emerald-500 ring-emerald-300"
                          : "bg-amber-500 ring-amber-300"
                      }`}
                    />
                    <div className="font-semibold text-slate-900">{item.event}</div>
                    <div className="text-slate-500 text-[11px]">{item.description}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(item.time).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
