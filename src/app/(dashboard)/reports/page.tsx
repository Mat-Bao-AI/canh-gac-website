"use client";

import React, { useState, useEffect } from "react";
import { Download, TrendingUp, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState("28d");
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [range]);

  const handleExportCSV = () => {
    window.location.href = `/api/reports?range=${range}&format=csv`;
  };

  const stats = data?.stats || {
    avgUptime: 99.67,
    totalIncidents: 12,
    totalDowntimeFormatted: "2 giờ 18 phút",
    totalChecks: 241920,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Báo cáo & Thống kê</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng hợp độ sẵn sàng uptime, sự cố và thời gian gián đoạn dịch vụ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="7d">7 ngày qua</option>
            <option value="28d">28 ngày qua</option>
            <option value="30d">30 ngày qua</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="saas-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Uptime trung bình
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.avgUptime}%</span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+0.23% so với kỳ trước</span>
          </p>
        </div>

        {/* KPI 2 */}
        <div className="saas-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Tổng sự cố
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.totalIncidents}</span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <span>↓ 5 so với kỳ trước</span>
          </p>
        </div>

        {/* KPI 3 */}
        <div className="saas-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Tổng thời gian downtime
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.totalDowntimeFormatted}</span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <span>↓ 1 giờ 20 phút</span>
          </p>
        </div>

        {/* KPI 4 */}
        <div className="saas-card p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Tổng lượt kiểm tra
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {Number(stats.totalChecks).toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Giám sát nền tự động</p>
        </div>
      </div>

      {/* Uptime Trend Area Chart */}
      <div className="saas-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Uptime theo thời gian</h3>
            <p className="text-xs text-slate-500">Tỷ lệ hoạt động ổn định trong giai đoạn báo cáo</p>
          </div>
        </div>

        <div className="h-80 w-full">
          {data?.uptimeTrend && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.uptimeTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  domain={[98, 100]}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "10px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: number) => [`${val}%`, "Uptime"]}
                />
                <Area
                  type="monotone"
                  dataKey="uptime"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#uptimeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
