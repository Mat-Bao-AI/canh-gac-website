"use client";

import React, { useState, useEffect } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2, Key, Mail, Bell, Shield, User } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("telegram");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(true);

  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(false);

  const [alertDown, setAlertDown] = useState(true);
  const [alertRecovery, setAlertRecovery] = useState(true);
  const [sslWarningDays, setSslWarningDays] = useState(15);
  const [slowResponseEnabled, setSlowResponseEnabled] = useState(true);
  const [slowResponseThreshold, setSlowResponseThreshold] = useState(2000);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const showMsg = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const u = json.data.user;
          const s = json.data.settings;
          setName(u.name || "");
          setEmail(u.email || "");

          if (s) {
            setBotToken(s.telegramBotToken || "");
            setChatId(s.telegramChatId || "");
            setTelegramEnabled(s.telegramEnabled ?? true);
            setSmtpHost(s.smtpHost || "");
            setSmtpPort(s.smtpPort || 587);
            setSmtpUser(s.smtpUser || "");
            setFromEmail(s.fromEmail || "");
            setEmailEnabled(s.emailEnabled ?? false);
            setAlertDown(s.alertDown ?? true);
            setAlertRecovery(s.alertRecovery ?? true);
            setSslWarningDays(s.sslWarningDays ?? 15);
            setSlowResponseEnabled(s.slowResponseEnabled ?? true);
            setSlowResponseThreshold(s.slowResponseThreshold ?? 2000);
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
    loadSettings();
  }, []);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const payload: Record<string, any> = {
        name,
        telegramBotToken: botToken,
        telegramChatId: chatId,
        telegramEnabled,
        smtpHost,
        smtpPort: Number(smtpPort),
        smtpUser,
        fromEmail,
        emailEnabled,
        alertDown,
        alertRecovery,
        sslWarningDays: Number(sslWarningDays),
        slowResponseEnabled,
        slowResponseThreshold: Number(slowResponseThreshold),
      };

      if (smtpPass) {
        payload.smtpPass = smtpPass;
      }

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showMsg("error", json.message || "Lỗi khi lưu cài đặt");
      } else {
        showMsg("success", "Đã lưu cấu hình cài đặt thành công!");
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch (err: unknown) {
      showMsg("error", err instanceof Error ? err.message : "Lỗi mạng");
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!botToken || !chatId) {
      showMsg("error", "Vui lòng nhập Bot Token và Chat ID trước khi kiểm tra");
      return;
    }

    setTestingTelegram(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/integrations/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken, chatId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showMsg("error", json.message || "Gửi tin nhắn Telegram thất bại");
      } else {
        showMsg("success", "Telegram đã kết nối và gửi tin nhắn kiểm tra thành công!");
      }
    } catch (err: unknown) {
      showMsg("error", err instanceof Error ? err.message : "Lỗi mạng");
    } finally {
      setTestingTelegram(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cài đặt hệ thống</h1>
        <p className="text-sm text-slate-500 mt-1">
          Cấu hình kênh cảnh báo Telegram, Email và quy tắc giám sát tự động
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-xs ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          onClick={() => setActiveTab("telegram")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === "telegram"
              ? "bg-blue-50 text-blue-600 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Cấu hình Telegram Bot</span>
        </button>
        <button
          onClick={() => setActiveTab("email")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === "email"
              ? "bg-blue-50 text-blue-600 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email (SMTP)</span>
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === "rules"
              ? "bg-blue-50 text-blue-600 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Quy tắc cảnh báo</span>
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === "profile"
              ? "bg-blue-50 text-blue-600 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Tài khoản</span>
        </button>
      </div>

      {/* Tab: Telegram Bot Setup (Matching Mockup) */}
      {activeTab === "telegram" && (
        <div className="saas-card p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Cấu hình Telegram Bot</h3>
            <p className="text-xs text-slate-500 mt-1">
              Nhận cảnh báo tức thì ngay khi website down hoặc SSL sắp hết hạn qua ứng dụng Telegram
            </p>
          </div>

          {/* 3 Steps Guide Box */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <div>
                <p className="font-bold text-slate-900">Tạo Bot với BotFather</p>
                <p className="text-slate-600">
                  Truy cập <b>@BotFather</b> trên Telegram và gõ lệnh <code>/newbot</code> để tạo một bot mới.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <div>
                <p className="font-bold text-slate-900">Lấy Token</p>
                <p className="text-slate-600">
                  Sao chép chuỗi HTTP API token do BotFather cung cấp (dạng: <code>123456:ABC-DEF1234...</code>).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <div>
                <p className="font-bold text-slate-900">Nhập thông tin vào hệ thống</p>
                <p className="text-slate-600">
                  Điền Bot Token và Chat ID người nhận hoặc Group ID vào hai ô bên dưới rồi kiểm tra kết nối.
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Bot Token <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="7123456789:AAH7bF...sample...bot_token"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Chat ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="-1001987654321 hoặc 123456789"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="enableTg"
              checked={telegramEnabled}
              onChange={(e) => setTelegramEnabled(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="enableTg" className="text-xs font-semibold text-slate-700">
              Kích hoạt kênh cảnh báo Telegram
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={testingTelegram}
              className="px-4 py-2.5 border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
            >
              {testingTelegram ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{testingTelegram ? "Đang gửi thử..." : "Kiểm tra kết nối"}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{saving ? "Đang lưu..." : "Lưu cấu hình"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab: Email SMTP */}
      {activeTab === "email" && (
        <div className="saas-card p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Cấu hình Email (SMTP)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Gửi email báo cáo định kỳ và thông báo sự cố qua giao thức SMTP
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                SMTP Host
              </label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                SMTP Port
              </label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
                placeholder="587"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                SMTP Username
              </label>
              <input
                type="text"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="notifications@yourdomain.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                SMTP Password
              </label>
              <input
                type="password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="enableEmail"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="enableEmail" className="text-xs font-semibold text-slate-700">
              Kích hoạt cảnh báo qua Email
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition"
            >
              {saving ? "Đang lưu..." : "Lưu cấu hình Email"}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Alert Rules */}
      {activeTab === "rules" && (
        <div className="saas-card p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Quy tắc cảnh báo & Ngưỡng kích hoạt</h3>
            <p className="text-xs text-slate-500 mt-1">
              Kiểm soát điều kiện gửi cảnh báo để tránh nhận thông báo rác (False positives)
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-900">Cảnh báo Website ngừng hoạt động (DOWN)</p>
                <p className="text-slate-500">Gửi ngay khi hệ thống xác nhận website lỗi sau 2 lần thử liên tiếp</p>
              </div>
              <input
                type="checkbox"
                checked={alertDown}
                onChange={(e) => setAlertDown(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-900">Cảnh báo Website phục hồi (RECOVERY)</p>
                <p className="text-slate-500">Thông báo thời gian downtime và xác nhận hoạt động bình thường trở lại</p>
              </div>
              <input
                type="checkbox"
                checked={alertRecovery}
                onChange={(e) => setAlertRecovery(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Ngưỡng cảnh báo chứng chỉ SSL sắp hết hạn</p>
                  <p className="text-slate-500">Gửi cảnh báo trước khi chứng chỉ SSL hết hiệu lực</p>
                </div>
                <select
                  value={sslWarningDays}
                  onChange={(e) => setSslWarningDays(Number(e.target.value))}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold"
                >
                  <option value={30}>Trước 30 ngày</option>
                  <option value={15}>Trước 15 ngày</option>
                  <option value={7}>Trước 7 ngày</option>
                  <option value={3}>Trước 3 ngày</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Cảnh báo tốc độ phản hồi chậm (Slow Response)</p>
                  <p className="text-slate-500">Ngưỡng độ trễ phản hồi vượt mức an toàn</p>
                </div>
                <select
                  value={slowResponseThreshold}
                  onChange={(e) => setSlowResponseThreshold(Number(e.target.value))}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold"
                >
                  <option value={1000}>Trên 1.000 ms (1s)</option>
                  <option value={2000}>Trên 2.000 ms (2s)</option>
                  <option value={3000}>Trên 3.000 ms (3s)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition"
            >
              {saving ? "Đang lưu..." : "Lưu quy tắc"}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Profile & Security */}
      {activeTab === "profile" && (
        <div className="saas-card p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Hồ sơ người dùng & Bảo mật</h3>
            <p className="text-xs text-slate-500 mt-1">Quản lý họ tên, email và đổi mật khẩu đăng nhập</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Họ và tên
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email tài khoản
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span>Đổi mật khẩu</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition"
            >
              {saving ? "Đang lưu..." : "Cập nhật hồ sơ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
