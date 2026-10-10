"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  Eye,
  Send,
  History,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Zap,
  ChevronRight,
  TrendingUp,
  XCircle,
  Rocket,
  Check,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { SystemSimulationHero } from "@/components/home/SystemSimulationHero";
import { TypewriterHeadline } from "@/components/home/TypewriterHeadline";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export default function LandingPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Tự động kiểm tra trạng thái phiên đăng nhập
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  // Xử lý đăng xuất phiên làm việc
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="border-b border-slate-200/60 bg-white/85 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="max-w-7xl xl:max-w-[1360px] 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-tight">
                Canh gác website
              </span>
              <span className="text-[10px] text-blue-600 font-semibold tracking-wider uppercase flex items-center gap-1.5">
                <span>Uptime & An ninh 24/7</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition">
              Tính năng
            </a>
            <a href="#problem" className="hover:text-blue-600 transition">
              Vấn đề & Giải pháp
            </a>
            <a href="#how-it-works" className="hover:text-blue-600 transition">
              Cách hoạt động
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            {user ? (
              // Khi đã đăng nhập: Chuyển nút Dashboard thành Tên người dùng và thêm nút Đăng xuất
              <>
                <Link
                  href="/overview"
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2 group"
                >
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <span className="max-w-[140px] truncate">{user.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </Link>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/90 rounded-xl transition flex items-center gap-1.5 cursor-pointer bg-white"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-600" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </>
            ) : (
              // Khi chưa đăng nhập: Hiển thị Đăng nhập, Đăng ký và nút Dashboard
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200/90 rounded-xl transition"
                >
                  Đăng ký
                </Link>
                <Link
                  href="/overview"
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2 whitespace-nowrap group"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-18 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
        {/* Precision Geometric Grid Mesh */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" 
        />
        {/* Ambient Radial Color Orbs for Depth & Color Harmony */}
        <div className="absolute top-8 left-1/4 -translate-x-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-blue-400/15 to-indigo-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-16 right-10 w-[500px] h-[500px] bg-gradient-to-br from-cyan-400/15 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl xl:max-w-[1360px] 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-center">
            {/* Left Column: Headlines, CTAs & Enterprise Metric Badges */}
            <div className="lg:col-span-7 space-y-6">
              {/* Telemetry Status Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-2xs text-xs font-medium text-slate-700 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-semibold text-slate-900">Vibe Host Telemetry</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600">Hạ tầng probe phân tán 24/7</span>
              </div>

              {/* Hero Title with Dynamic Animated Typewriter Text */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] xl:text-[2.9rem] font-black text-slate-900 tracking-tight leading-tight sm:leading-snug">
                <span className="block text-slate-900 mb-2.5 sm:mb-3.5">
                  Canh gác website 24/7
                </span>
                <span className="block min-h-[1.3em]">
                  <TypewriterHeadline />
                </span>
              </h1>

              {/* Hero Description */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">
                Hệ thống probe phân tán liên tục đo đạc độ trễ DNS, TCP, TLS mili-giây. Tự động phát hiện gián đoạn máy chủ, cảnh báo chứng chỉ SSL và rủi ro an ninh — gửi cảnh báo tức thì qua Telegram trước khi người dùng phàn nàn.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Link
                  href="/overview"
                  className="group px-7 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition flex items-center gap-2 transform active:scale-95"
                >
                  <span>{user ? `Vào Dashboard (${user.name})` : "Truy cập Dashboard"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <a
                  href="#features"
                  className="px-6 py-3.5 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-2xs hover:border-slate-300 transition flex items-center gap-2"
                >
                  <span>Khám phá kiến trúc</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>

              {/* Technical Specifications Highlights (Replacing generic bullet checklist) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-6 border-t border-slate-200/80">
                <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs sm:text-sm font-mono">
                    <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>&lt; 30ms</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5">Tốc độ đo đạc</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs sm:text-sm font-mono">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>60 giây</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5">Chu kỳ probe</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs sm:text-sm font-mono">
                    <Send className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>&lt; 15 giây</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5">Báo Telegram</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-teal-600 font-bold text-xs sm:text-sm font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>100% Free</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5">Vibe Host Core</p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Live System Simulation Component with Depth Frame */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-lg">
                {/* Ambient radiant back-glow */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600/25 via-indigo-600/20 to-cyan-500/25 rounded-3xl blur-2xl opacity-75 -z-10" />

                <SystemSimulationHero />

                {/* Floating High-Trust Badge 1: Top-Right */}
                <div className="hidden sm:flex absolute -top-3.5 -right-3.5 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-slate-200/80 items-center gap-2 text-xs font-semibold text-slate-800 z-20">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                  <span>Uptime SLA: <strong>99.99%</strong></span>
                </div>

                {/* Floating High-Trust Badge 2: Bottom-Left */}
                <div className="hidden sm:flex absolute -bottom-3.5 -left-3.5 bg-slate-900/95 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-slate-700/80 items-center gap-2 text-xs font-semibold z-20">
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  <span>Telegram Alert: <strong>Tức thì</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Features Strip */}
      <section id="features" className="py-16 bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tính năng cốt lõi vì sự an toàn của website
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Bộ công cụ toàn diện giúp kỹ thuật viên và chủ doanh nghiệp kiểm soát toàn bộ hạ tầng web
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Feature 1 */}
            <div className="saas-card p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Uptime Monitor</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kiểm tra liên tục 24/7 theo chu kỳ tùy chọn từ 1 đến 5 phút
              </p>
            </div>

            {/* Feature 2 */}
            <div className="saas-card p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Theo dõi SSL</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cảnh báo trước khi chứng chỉ SSL hết hạn 30, 15, 7 ngày
              </p>
            </div>

            {/* Feature 3 */}
            <div className="saas-card p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Phát hiện bất thường</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Quét mã nguồn, phát hiện từ khóa casino, cờ bạc và link lạ
              </p>
            </div>

            {/* Feature 4 */}
            <div className="saas-card p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Cảnh báo tức thì</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gửi thông báo ngay lập tức qua Telegram Bot và Email
              </p>
            </div>

            {/* Feature 5 */}
            <div className="saas-card p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Nhật ký sự cố</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Lưu trữ thời gian downtime, nguyên nhân và xuất báo cáo CSV
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section id="problem" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* The Problem */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100/70 text-rose-700 text-xs font-bold border border-rose-200/80 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Thực trạng phổ biến</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Website của bạn có thể chết bất cứ lúc nào mà bạn không hề hay biết
              </h2>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="p-3.5 bg-rose-50/80 border border-rose-200/80 rounded-2xl flex items-center gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <XCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <span className="font-medium">Máy chủ sập, lỗi HTTP 500 giữa đêm làm mất khách hàng và doanh thu.</span>
                </div>
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="font-medium">Chứng chỉ SSL hết hạn, trình duyệt cảnh báo nguy hiểm khiến người dùng sợ hãi.</span>
                </div>
                <div className="p-3.5 bg-purple-50/80 border border-purple-200/80 rounded-2xl flex items-center gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-medium">Website bị chèn mã độc, link cờ bạc ẩn làm rớt thứ hạng SEO Google.</span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="font-medium">Chỉ biết website lỗi khi khách hàng gọi điện phản ánh và phàn nàn.</span>
                </div>
              </div>
            </div>

            {/* The Solution */}
            <div className="relative rounded-3xl p-8 sm:p-9 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white border border-blue-900/60 shadow-2xl overflow-hidden space-y-6">
              {/* Decorative ambient gradient blooms */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Giải pháp toàn diện</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Canh Gác Website canh chừng liên tục 24/7 thay bạn
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  Hệ thống tự động thực hiện hàng nghìn lượt kiểm tra độc lập, phân tích mã phản hồi HTTP, quét
                  thời hạn chứng chỉ TLS và so khớp nội dung trang chủ.
                </p>

                <div className="space-y-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex items-center gap-3 shadow-inner">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-xs text-slate-200 font-medium">Bộ lọc chống báo giả (False Positive Protection) với ngưỡng thử lại thông minh</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex items-center gap-3 shadow-inner">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-xs text-slate-200 font-medium">Tự động phát hiện khi website phục hồi và tính toán thời gian gián đoạn</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex items-center gap-3 shadow-inner">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-xs text-slate-200 font-medium">Bảo vệ tối đa nhờ bộ lọc an ninh chống SSRF và phân giải DNS nghiêm ngặt</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            Bắt đầu chỉ với 3 bước đơn giản
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto mb-16">
            Thiết lập trong chưa đầy 60 giây và bắt đầu nhận cảnh báo sự cố ngay lập tức
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="saas-card p-8 text-left space-y-4">
              <span className="text-3xl font-black text-blue-600">01</span>
              <h3 className="text-lg font-bold text-slate-900">Thêm website</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nhập tên miền website của bạn, thiết lập chu kỳ kiểm tra và từ khóa kỳ vọng cần theo dõi.
              </p>
            </div>

            <div className="saas-card p-8 text-left space-y-4">
              <span className="text-3xl font-black text-blue-600">02</span>
              <h3 className="text-lg font-bold text-slate-900">Canh gác tự động</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống worker chạy ngầm độc lập sẽ liên tục ping, đo tốc độ phản hồi và theo dõi chứng chỉ SSL.
              </p>
            </div>

            <div className="saas-card p-8 text-left space-y-4">
              <span className="text-3xl font-black text-blue-600">03</span>
              <h3 className="text-lg font-bold text-slate-900">Nhận cảnh báo</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nhận tin nhắn báo lỗi kèm mã sự cố trực tiếp qua Telegram ngay khi phát hiện bất thường.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community / Free Template Section for Vibe Host */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Vibe Host Template</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1 mb-2">
              Hoàn toàn miễn phí & Mã nguồn mở
            </h2>
            <p className="text-sm text-slate-500">
              Template sẵn sàng triển khai trên Vibe Host — không thu phí, không giới hạn tính năng
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="saas-card p-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Rocket className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Tối ưu cho Vibe Host</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Thiết kế kiến trúc chuẩn Node.js, tương thích tuyệt đối với môi trường hosting của Vibe Host.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Triển khai nhanh chóng</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Hỗ trợ Docker & Node runtime</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Tích hợp sẵn biến môi trường</li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="saas-card p-8 space-y-4 border-2 border-blue-600 shadow-xl relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-full">
                Miễn phí 100%
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Mở toàn bộ tính năng</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tất cả tính năng cao cấp đều có thể sử dụng ngay mà không bị giới hạn gói dịch vụ nào.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Giám sát website không giới hạn</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Cảnh báo tức thì qua Telegram Bot</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Quét an ninh & kiểm tra SSL thật</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Báo cáo & xuất file CSV</li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="saas-card p-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Tự chủ dữ liệu 100%</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Dữ liệu website, check logs và sự cố được lưu trữ an toàn trong chính cơ sở dữ liệu của bạn.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Tự quản lý cơ sở dữ liệu</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Bộ lọc bảo mật chống SSRF</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Không phụ thuộc bên thứ ba</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Strip */}
      <section className="py-16 bg-blue-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Đừng đợi khách hàng báo website của bạn đang lỗi!
          </h2>
          <p className="text-sm text-blue-100 max-w-xl mx-auto">
            Bắt đầu theo dõi toàn diện uptime, chứng chỉ SSL và an toàn trang web ngay hôm nay với Canh Gác Website.
          </p>
          <div>
            <Link
              href="/overview"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-blue-600 hover:bg-blue-50 font-bold text-sm rounded-xl shadow-lg transition"
            >
              <span>Bắt đầu giám sát ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 text-xs text-center border-t border-slate-800">
        <p>© 2026 Canh Gác Website - Website Uptime, SSL & Security Monitoring Platform.</p>
      </footer>
    </div>
  );
}
