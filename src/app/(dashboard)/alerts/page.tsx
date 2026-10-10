"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Send, CheckCircle2, AlertTriangle, Shield, ShieldAlert, Clock, XCircle, Lock, Mail } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

interface AlertItem {
  id: string;
  websiteId: string;
  eventType: string;
  channel: string;
  messageBody: string;
  status: string;
  sentAt: string;
  website: {
    id: string;
    name: string;
    url: string;
  };
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [counts, setCounts] = useState({ all: 0, down: 0, recovery: 0, ssl: 0, security: 0 });
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/alerts?tab=${activeTab}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAlerts(json.data);
          setCounts(json.counts);
        }
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [activeTab]);

  const tabs = [
    { key: "ALL", label: "Tất cả", count: counts.all },
    { key: "DOWN", label: "Sự cố gián đoạn", count: counts.down },
    { key: "RECOVERY", label: "Phục hồi", count: counts.recovery },
    { key: "SSL", label: "Cảnh báo SSL", count: counts.ssl },
    { key: "SECURITY", label: "An ninh", count: counts.security },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trung tâm cảnh báo</h1>
        <p className="text-sm text-slate-500 mt-1">
          Lịch sử các cảnh báo và thông báo tức thì gửi qua Telegram & Email
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-2 rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-2xs"
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

      {/* Alerts Feed */}
      <div className="saas-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Đang tải danh sách cảnh báo...</div>
        ) : alerts.length === 0 ? (
          <EmptyState
            title="Chưa có cảnh báo nào"
            description="Khi website gặp sự cố hoặc chứng chỉ SSL sắp hết hạn, hệ thống sẽ tự động lưu và gửi thông báo tại đây."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {alerts.map((alert) => {
              const isDown = alert.eventType === "DOWN";
              const isRecovery = alert.eventType === "RECOVERY";
              const isSSL = alert.eventType === "SSL_WARNING";
              const isAnomaly = alert.eventType === "ANOMALY";
              const isTest = alert.eventType === "TEST";

              return (
                <div key={alert.id} className="p-4 md:p-5 hover:bg-slate-50/70 transition flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isDown
                        ? "bg-rose-50 text-rose-600 border border-rose-100"
                        : isAnomaly
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : isRecovery
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : isSSL
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : isTest
                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                        : "bg-slate-50 text-slate-600 border border-slate-100"
                    }`}
                  >
                    {isDown ? (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    ) : isAnomaly ? (
                      <ShieldAlert className="w-5 h-5 text-rose-600" />
                    ) : isRecovery ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : isSSL ? (
                      <Lock className="w-5 h-5 text-amber-600" />
                    ) : isTest ? (
                      alert.channel === "EMAIL" ? (
                        <Mail className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Send className="w-5 h-5 text-sky-500" />
                      )
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/websites/${alert.website.id}`}
                          className="font-bold text-slate-900 text-sm hover:text-blue-600 transition"
                        >
                          {alert.website.name}
                        </Link>
                        <span className="text-xs text-slate-400">•</span>
                        <span
                          className={`text-xs font-semibold ${
                            isDown
                              ? "text-rose-600"
                              : isAnomaly
                              ? "text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200"
                              : isRecovery
                              ? "text-emerald-600"
                              : isSSL
                              ? "text-amber-600"
                              : isTest
                              ? "text-blue-600"
                              : "text-slate-600"
                          }`}
                        >
                          {isDown
                            ? "Website gặp lỗi"
                            : isAnomaly
                            ? "🛡️ Cảnh báo bất thường & Vi phạm an ninh"
                            : isRecovery
                            ? "Đã phục hồi hoạt động"
                            : isSSL
                            ? "Chứng chỉ SSL sắp hết hạn"
                            : isTest
                            ? "Kiểm tra kết nối thông báo"
                            : "Cảnh báo an ninh"}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.sentAt).toLocaleString("vi-VN")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-mono whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                      {alert.messageBody}
                    </p>

                    <div className="flex items-center gap-3 mt-2.5 text-[11px] text-slate-400 font-medium">
                      {alert.channel === "EMAIL" ? (
                        <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                          <Mail className="w-3.5 h-3.5" /> Kênh: Email (SMTP)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-blue-600 font-semibold">
                          <Send className="w-3.5 h-3.5" /> Kênh: Telegram Bot
                        </span>
                      )}
                      <span>•</span>
                      <span className={alert.status === "SENT" ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                        Trạng thái: {alert.status === "SENT" ? "Đã gửi (Sent)" : "Thất bại (Failed)"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
