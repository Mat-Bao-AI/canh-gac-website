"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  Menu,
  Globe,
  LogOut,
  Settings,
  Mail,
  Send,
  AlertTriangle,
  CheckCircle2,
  Shield,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  user?: {
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
}

interface RecentAlert {
  id: string;
  eventType: string;
  channel: string;
  messageBody: string;
  status: string;
  sentAt: string;
  website?: {
    name: string;
    url: string;
  };
}

export function Header({ onToggleMobileMenu, user }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchAlerts = async () => {
    try {
      setLoadingAlerts(true);
      const res = await fetch("/api/alerts?tab=ALL");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setRecentAlerts(json.data.slice(0, 5));
          setTotalAlerts(json.counts?.all || json.data.length || 0);
        }
      }
    } catch {
      // Ignored
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Refresh alerts periodically every 45s
    const interval = setInterval(fetchAlerts, 45000);
    return () => clearInterval(interval);
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/websites?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm website..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </form>
      </div>

      {/* Right: Notifications & User profile */}
      <div className="flex items-center gap-3">
        {/* Interactive Notification Bell Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              if (!showNotifMenu) fetchAlerts();
            }}
            className={`relative p-2 rounded-xl transition cursor-pointer ${
              showNotifMenu
                ? "bg-blue-50 text-blue-600"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
            title="Trung tâm thông báo"
            aria-label="Xem thông báo"
          >
            <Bell className="w-5 h-5" />
            {totalAlerts > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                {totalAlerts > 99 ? "99+" : totalAlerts}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-3.5 px-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">Thông báo & Cảnh báo</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {totalAlerts} thông báo
                </span>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {loadingAlerts && recentAlerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">Đang tải thông báo...</div>
                ) : recentAlerts.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">Tất cả website hoạt động ổn định</p>
                    <p className="text-[11px] text-slate-400">
                      Khi có sự cố DOWN hoặc kiểm tra kết nối, thông báo sẽ hiển thị ngay tại đây.
                    </p>
                  </div>
                ) : (
                  recentAlerts.map((item) => {
                    const isDown = item.eventType === "DOWN";
                    const isRecovery = item.eventType === "RECOVERY";
                    const isTest = item.eventType === "TEST";

                    return (
                      <div
                        key={item.id}
                        className="p-3 px-4 hover:bg-slate-50 transition flex items-start gap-3 cursor-pointer"
                        onClick={() => {
                          setShowNotifMenu(false);
                          router.push("/alerts");
                        }}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isDown
                              ? "bg-rose-50 text-rose-600"
                              : isRecovery
                              ? "bg-emerald-50 text-emerald-600"
                              : isTest
                              ? "bg-blue-50 text-blue-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {isDown ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : isRecovery ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : item.channel === "EMAIL" ? (
                            <Mail className="w-4 h-4" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {item.website?.name || "Hệ thống giám sát"}
                            </p>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(item.sentAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                            {item.messageBody}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 flex items-center gap-1">
                              {item.channel === "EMAIL" ? (
                                <>
                                  <Mail className="w-2.5 h-2.5 text-blue-600" /> Email (SMTP)
                                </>
                              ) : (
                                <>
                                  <Send className="w-2.5 h-2.5 text-sky-500" /> Telegram
                                </>
                              )}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                item.status === "SENT"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {item.status === "SENT" ? "Đã gửi" : "Lỗi gửi"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 px-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href="/settings"
                  onClick={() => setShowNotifMenu(false)}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" /> Cấu hình gửi mail
                </Link>
                <Link
                  href="/alerts"
                  onClick={() => setShowNotifMenu(false)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  user?.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
                }
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.name || "Nguyễn Văn A"}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">Quản trị viên</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user?.name || "Nguyễn Văn A"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || "admin@canhgacwebsite.vn"}</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Cài đặt tài khoản</span>
              </Link>
              <Link
                href="/websites"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Danh sách website</span>
              </Link>
              <div className="h-px bg-slate-100 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

