"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Mail, AlertCircle, Loader2, KeyRound, ArrowLeft } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2FA state
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Đăng nhập thất bại");
        setLoading(false);
        return;
      }

      // Nếu tài khoản yêu cầu xác thực 2 bước
      if (json.requires2FA && json.tempToken) {
        setTempToken(json.tempToken);
        setStep("2fa");
        setLoading(false);
        return;
      }

      window.location.href = "/overview";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi kết nối");
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken || !twoFactorCode.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, code: twoFactorCode.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Mã xác thực không chính xác");
        setLoading(false);
        return;
      }

      window.location.href = "/overview";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi kết nối");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">Canh gác website</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900 pt-2">
            {step === "credentials" ? "Đăng nhập tài khoản" : "Xác thực 2 bước (2FA)"}
          </h2>
          <p className="text-xs text-slate-500">
            {step === "credentials"
              ? "Hệ thống giám sát vận hành & an ninh mạng 24/7"
              : "Bảo vệ tài khoản bằng lớp bảo mật thứ hai (Google / Microsoft Authenticator)"}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: ĐĂNG NHẬP BẰNG TÀI KHOẢN VÀ MẬT KHẨU */}
        {step === "credentials" ? (
          <form onSubmit={handleCredentialsSubmit} className="saas-card p-6 sm:p-8 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email đăng nhập
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <PasswordInput
              label="Mật khẩu"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
              showStrengthMeter={false}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="rememberMe"
                  defaultChecked
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <Link href="/forgot-password" className="text-blue-600 hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? "Đang xác thực..." : "Đăng nhập"}</span>
            </button>

            <p className="text-center text-xs text-slate-500 pt-2">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                Đăng ký tài khoản
              </Link>
            </p>
          </form>
        ) : (
          /* STEP 2: NHẬP MÃ XÁC THỰC 2FA / RECOVERY CODE */
          <form onSubmit={handle2FASubmit} className="saas-card p-6 sm:p-8 space-y-5 animate-fadeIn">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-800">
              <KeyRound className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Tài khoản được bảo vệ bằng 2FA</span>
                <span>
                  {useRecoveryCode
                    ? "Nhập mã khôi phục 8 ký tự dự phòng đã lưu (dạng XXXX-XXXX):"
                    : "Mở ứng dụng Google Authenticator hoặc Microsoft Authenticator và nhập mã 6 số:"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {useRecoveryCode ? "Mã khôi phục dự phòng" : "Mã xác thực 6 chữ số"}
              </label>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder={useRecoveryCode ? "XXXX-XXXX" : "123456"}
                maxLength={useRecoveryCode ? 10 : 6}
                autoFocus
                required
                className="w-full text-center tracking-widest text-lg font-mono py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setUseRecoveryCode(!useRecoveryCode);
                  setTwoFactorCode("");
                  setError(null);
                }}
                className="text-blue-600 hover:underline font-medium"
              >
                {useRecoveryCode ? "Quay lại dùng mã ứng dụng 6 số" : "Dùng mã khôi phục dự phòng"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setError(null);
                }}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Đổi tài khoản</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !twoFactorCode.trim()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? "Đang kiểm tra mã..." : "Xác nhận & Vào hệ thống"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
