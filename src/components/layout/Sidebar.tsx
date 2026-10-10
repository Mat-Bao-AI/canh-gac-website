"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  AlertOctagon,
  Bell,
  BarChart3,
  Settings,
  ShieldCheck,
  Sparkles,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  onCloseMobile?: () => void;
  user?: {
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
}

export function Sidebar({ onCloseMobile, user }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Tổng quan", href: "/overview", icon: LayoutDashboard },
    { label: "Danh sách website", href: "/websites", icon: Globe },
    { label: "Lịch sử sự cố", href: "/incidents", icon: AlertOctagon },
    { label: "Cảnh báo", href: "/alerts", icon: Bell },
    { label: "Báo cáo", href: "/reports", icon: BarChart3 },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Logo */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 tracking-tight text-base leading-tight">
            Canh gác website
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Uptime & Security</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Menu chính
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/overview" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-4 pb-2">
          <div className="h-px bg-slate-100 mx-2" />
        </div>

        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Hệ thống
        </div>
        <Link
          href="/settings"
          onClick={onCloseMobile}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            pathname.startsWith("/settings")
              ? "bg-blue-50 text-blue-600 font-semibold shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Settings className={`w-4 h-4 ${pathname.startsWith("/settings") ? "text-blue-600" : "text-slate-400"}`} />
          <span>Cài đặt</span>
        </Link>
      </div>

      {/* Vibe Host Template Badge */}
      <div className="p-3">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-800">Vibe Host Template</span>
          </div>
          <p className="text-[11px] text-slate-500">Giám sát miễn phí 24/7</p>
        </div>
      </div>

      {/* User info at bottom */}
      <div className="p-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || "Nguyễn Văn A"}</p>
            <p className="text-[11px] text-slate-500 truncate">Quản trị viên</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
