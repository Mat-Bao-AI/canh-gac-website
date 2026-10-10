"use client";

import React, { useState, useEffect } from "react";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  Mail,
  Bell,
  Shield,
  User,
  ShieldCheck,
  QrCode,
  KeyRound,
  Copy,
  Check,
  Lock,
  Smartphone,
  RefreshCw,
  X,
  Sparkles,
} from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("telegram");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup2FAModal, setShowSetup2FAModal] = useState(false);
  const [setup2FAData, setSetup2FAData] = useState<{ secret: string; otpAuthUrl: string; recoveryCodes: string[] } | null>(null);
  const [setup2FACode, setSetup2FACode] = useState("");
  const [activating2FA, setActivating2FA] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [disable2FACode, setDisable2FACode] = useState("");
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

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
  const [repeatAlertHours, setRepeatAlertHours] = useState(1);
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
          setTwoFactorEnabled(Boolean(u.twoFactorEnabled));

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
            setRepeatAlertHours(s.repeatAlertHours ?? 1);
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
        repeatAlertHours: Number(repeatAlertHours),
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
    setTestingTelegram(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/integrations/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: botToken || undefined,
          chatId: chatId || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showMsg("error", json.message || "Gửi tin nhắn Telegram thất bại");
      } else {
        setTelegramEnabled(true);
        showMsg("success", json.message || "Telegram đã kết nối và gửi tin nhắn kiểm tra thành công!");
      }
    } catch (err: unknown) {
      showMsg("error", err instanceof Error ? err.message : "Lỗi mạng");
    } finally {
      setTestingTelegram(false);
    }
  };

  const [testingEmail, setTestingEmail] = useState(false);

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/integrations/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost: smtpHost || undefined,
          smtpPort: Number(smtpPort) || 587,
          smtpUser: smtpUser || undefined,
          smtpPass: smtpPass || undefined,
          toEmail: email || smtpUser || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showMsg("error", json.message || "Gửi email kiểm tra thất bại");
      } else {
        setEmailEnabled(true);
        showMsg("success", json.message || "Email kiểm tra đã được gửi thành công!");
      }
    } catch (err: unknown) {
      showMsg("error", err instanceof Error ? err.message : "Lỗi mạng");
    } finally {
      setTestingEmail(false);
    }
  };

  const handleStartSetup2FA = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        setSetup2FAData(json.data);
        setSetup2FACode("");
        setCopiedSecret(false);
        setCopiedCodes(false);
        setShowSetup2FAModal(true);
      } else {
        showMsg("error", json.message || "Không thể khởi tạo mã xác thực 2 bước");
      }
    } catch {
      showMsg("error", "Lỗi mạng khi khởi tạo 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setup2FAData || !setup2FACode.trim()) return;

    setActivating2FA(true);
    try {
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: setup2FAData.secret,
          code: setup2FACode.trim(),
          recoveryCodes: setup2FAData.recoveryCodes,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setTwoFactorEnabled(true);
        setShowSetup2FAModal(false);
        setSetup2FAData(null);
        setSetup2FACode("");
        showMsg("success", "Đã kích hoạt xác thực 2 bước (2FA) thành công!");
      } else {
        showMsg("error", json.message || "Mã xác thực không chính xác");
      }
    } catch {
      showMsg("error", "Lỗi kết nối máy chủ");
    } finally {
      setActivating2FA(false);
    }
  };

  const handleConfirmDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disable2FACode.trim()) return;

    setDisabling2FA(true);
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disable2FACode.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setTwoFactorEnabled(false);
        setShowDisable2FAModal(false);
        setDisable2FACode("");
        showMsg("success", "Đã hủy kích hoạt xác thực 2 bước thành công");
      } else {
        showMsg("error", json.message || "Mã OTP hoặc mật khẩu không đúng");
      }
    } catch {
      showMsg("error", "Lỗi kết nối máy chủ");
    } finally {
      setDisabling2FA(false);
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
              Kích hoạt cảnh báo sự cố qua Email
            </label>
          </div>

          {/* Hướng dẫn cấu hình SMTP */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-slate-600 leading-relaxed space-y-1">
            <p className="font-semibold text-blue-900 flex items-center gap-1.5">
              <span>💡</span> Hướng dẫn cấu hình gửi mail SMTP nhanh:
            </p>
            <p>
              • <b>Gmail / Google Workspace:</b> Host là <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-700 font-mono">smtp.gmail.com</code>, Port <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-700 font-mono">587</code>. Bạn cần bật <i>Xác minh 2 bước</i> trong tài khoản Google và tạo <b>Mật khẩu ứng dụng (App Password)</b> 16 ký tự để dán vào ô SMTP Password.
            </p>
            <p>
              • Email kiểm tra sẽ được gửi trực tiếp đến hộp thư tài khoản của bạn: <b>{email || "email của bạn"}</b>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleTestEmail}
              disabled={testingEmail || saving}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {testingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Đang kết nối SMTP & gửi thử...</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Kiểm tra kết nối Email (Gửi thử)</span>
                </>
              )}
            </button>

            <button
              onClick={handleSaveSettings}
              disabled={saving || testingEmail}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
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
                  <p className="font-bold text-slate-900">Tần suất nhắc lại cảnh báo khi website vẫn sập</p>
                  <p className="text-slate-500">Gửi lại thông báo định kỳ nếu sự cố gián đoạn chưa được khắc phục</p>
                </div>
                <select
                  value={repeatAlertHours}
                  onChange={(e) => setRepeatAlertHours(Number(e.target.value))}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
                >
                  <option value={1}>Mỗi 1 giờ nhắc lại 1 lần (Khuyên dùng)</option>
                  <option value={2}>Mỗi 2 giờ nhắc lại 1 lần</option>
                  <option value={3}>Mỗi 3 giờ nhắc lại 1 lần</option>
                  <option value={6}>Mỗi 6 giờ nhắc lại 1 lần</option>
                  <option value={12}>Mỗi 12 giờ nhắc lại 1 lần</option>
                  <option value={24}>Mỗi 24 giờ (1 ngày) nhắc lại 1 lần</option>
                  <option value={0}>Tắt nhắc lại (Chỉ báo 1 lần duy nhất)</option>
                </select>
              </div>
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

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span>Đổi mật khẩu tài khoản</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <PasswordInput
                  label="Mật khẩu mới"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Nhập mật khẩu mới an toàn"
                  required={false}
                  showStrengthMeter={true}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{saving ? "Đang lưu..." : "Lưu thay đổi mật khẩu"}</span>
              </button>
            </div>
          </div>

          {/* Section: Xác thực 2 bước (2FA) */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Xác thực 2 bước (Two-Factor Authentication - 2FA)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Bảo vệ tài khoản tối đa bằng ứng dụng xác thực Google Authenticator hoặc Microsoft Authenticator
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    twoFactorEnabled
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${twoFactorEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                  <span>{twoFactorEnabled ? "Đang bảo vệ (Đã bật)" : "Chưa kích hoạt"}</span>
                </span>

                {twoFactorEnabled ? (
                  <button
                    type="button"
                    onClick={() => setShowDisable2FAModal(true)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition"
                  >
                    Tắt 2FA
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartSetup2FA}
                    disabled={loading}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Bật 2FA ngay</span>
                  </button>
                )}
              </div>
            </div>

            {twoFactorEnabled ? (
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Tài khoản của bạn đang được bảo vệ an toàn</p>
                  <p className="text-emerald-700">
                    Mỗi khi đăng nhập trên thiết bị mới, hệ thống sẽ yêu cầu mã xác thực 6 chữ số sinh ra từ ứng dụng Authenticator của bạn.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs text-slate-600 flex items-start gap-3">
                <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">Khuyên dùng cho tài khoản quản trị</p>
                  <p className="text-slate-500 mt-0.5">
                    Ngăn chặn 99.9% rủi ro bị lộ mật khẩu bằng cách yêu cầu mã xác thực động TOTP 30 giây một lần.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CÀI ĐẶT 2FA */}
      {showSetup2FAModal && setup2FAData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Cài đặt xác thực 2 bước (2FA)</h3>
                  <p className="text-xs text-slate-500">Chuẩn bảo mật quốc tế RFC 6238</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSetup2FAModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bước 1: Quét mã QR */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Bước 1: Quét mã QR trong ứng dụng Authenticator
              </span>
              <p className="text-xs text-slate-500">
                Mở <b>Google Authenticator</b>, <b>Microsoft Authenticator</b> hoặc ứng dụng TOTP bất kỳ và quét mã dưới đây:
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-200 shrink-0">
                  {/* QR Code trực tiếp */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      setup2FAData.otpAuthUrl
                    )}`}
                    alt="2FA QR Code"
                    className="w-32 h-32"
                  />
                </div>
                <div className="text-xs space-y-2 min-w-0 flex-1">
                  <span className="text-slate-500 block">Hoặc nhập khóa bí mật thủ công:</span>
                  <div className="font-mono bg-white p-2 rounded-lg border border-slate-200 text-slate-800 text-[11px] break-all select-all font-bold">
                    {setup2FAData.secret}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(setup2FAData.secret);
                      setCopiedSecret(true);
                      setTimeout(() => setCopiedSecret(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    {copiedSecret ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSecret ? "Đã sao chép khóa!" : "Sao chép khóa"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bước 2: Lưu mã khôi phục */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Bước 2: Lưu mã khôi phục dự phòng (Recovery Codes)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(setup2FAData.recoveryCodes.join("\n"));
                    setCopiedCodes(true);
                    setTimeout(() => setCopiedCodes(false), 2000);
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  {copiedCodes ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCodes ? "Đã sao chép 8 mã" : "Sao chép tất cả"}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Nếu mất điện thoại, bạn có thể dùng một trong các mã này để đăng nhập lại:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-center text-slate-800 font-bold">
                {setup2FAData.recoveryCodes.map((c, i) => (
                  <div key={i} className="bg-white py-1 px-1.5 rounded border border-slate-100">
                    {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Bước 3: Xác thực mã 6 số */}
            <form onSubmit={handleConfirmEnable2FA} className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Bước 3: Nhập mã 6 chữ số từ ứng dụng để hoàn tất
                </label>
                <input
                  type="text"
                  value={setup2FACode}
                  onChange={(e) => setSetup2FACode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                  autoFocus
                  className="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSetup2FAModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={activating2FA || setup2FACode.length < 6}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {activating2FA && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{activating2FA ? "Đang xác thực..." : "Kích hoạt bảo vệ 2FA"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TẮT 2FA */}
      {showDisable2FAModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">Hủy kích hoạt 2FA</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDisable2FAModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn tắt xác thực 2 bước? Tài khoản của bạn sẽ chỉ được bảo vệ bởi mật khẩu đơn lẻ.
            </p>

            <form onSubmit={handleConfirmDisable2FA} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nhập mã Authenticator 6 số hoặc mật khẩu để xác nhận
                </label>
                <input
                  type="password"
                  value={disable2FACode}
                  onChange={(e) => setDisable2FACode(e.target.value)}
                  placeholder="Mã 6 số hoặc mật khẩu"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisable2FAModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Giữ nguyên
                </button>
                <button
                  type="submit"
                  disabled={disabling2FA || !disable2FACode.trim()}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {disabling2FA && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{disabling2FA ? "Đang tắt..." : "Xác nhận tắt 2FA"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
