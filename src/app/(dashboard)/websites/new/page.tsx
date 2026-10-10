"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, AlertCircle, Loader2 } from "lucide-react";

export default function AddWebsitePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [checkInterval, setCheckInterval] = useState(300);
  const [expectedStatusCode, setExpectedStatusCode] = useState(200);
  const [expectedKeyword, setExpectedKeyword] = useState("");
  const [enableMonitoring, setEnableMonitoring] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate name from URL if name is empty
  const handleUrlBlur = () => {
    if (url && !name) {
      try {
        const fullUrl = url.startsWith("http") ? url : `https://${url}`;
        const u = new URL(fullUrl);
        setName(u.hostname.replace(/^www\./, ""));
      } catch {
        // Ignored
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = `https://${finalUrl}`;
    }

    if (!finalUrl) {
      setError("Vui lòng nhập URL website");
      return;
    }
    if (!name.trim()) {
      setError("Vui lòng nhập tên website");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: finalUrl,
          name: name.trim(),
          checkInterval: Number(checkInterval),
          expectedStatusCode: Number(expectedStatusCode),
          expectedKeyword: expectedKeyword.trim() || null,
          enableMonitoring,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Không thể thêm website");
        setLoading(false);
        return;
      }

      router.push(`/websites/${json.data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi mạng");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb / Back button */}
      <div>
        <Link
          href="/websites"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại danh sách website</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Thêm website mới</h1>
        <p className="text-sm text-slate-500 mt-1">
          Cấu hình thông số giám sát tự động 24/7 và cảnh báo sự cố
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="saas-card p-6 md:p-8 space-y-6">
        {/* URL website */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            URL Website <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              https://
            </span>
            <input
              type="text"
              value={url.replace(/^https?:\/\//, "")}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="domain.com hoặc domain.vn"
              required
              className="w-full pl-16 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
            <Shield className="w-3 h-3 text-slate-400" />
            <span>Được bảo vệ bởi cơ chế chống SSRF và kiểm tra DNS tự động.</span>
          </p>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Tên gợi nhớ <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Trang bán hàng chính, Cổng thanh toán..."
            required
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Check Interval */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Khoảng thời gian kiểm tra <span className="text-rose-500">*</span>
          </label>
          <select
            value={checkInterval}
            onChange={(e) => setCheckInterval(Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          >
            <option value={60}>1 phút (60 giây) - Tối ưu cho hệ thống quan trọng</option>
            <option value={180}>3 phút (180 giây)</option>
            <option value={300}>5 phút (300 giây) - Khuyến nghị</option>
            <option value={600}>10 phút (600 giây)</option>
            <option value={1800}>30 phút (1800 giây)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Expected Status Code */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Mã HTTP kỳ vọng
            </label>
            <input
              type="number"
              value={expectedStatusCode}
              onChange={(e) => setExpectedStatusCode(Number(e.target.value))}
              placeholder="200"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Expected Keyword */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Từ khóa kỳ vọng (Tùy chọn)
            </label>
            <input
              type="text"
              value={expectedKeyword}
              onChange={(e) => setExpectedKeyword(e.target.value)}
              placeholder="Ví dụ: Chào mừng, Website chính thức"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Monitoring Toggle */}
        <div className="flex items-center justify-between pt-2 pb-1 border-t border-slate-100">
          <div>
            <p className="text-xs font-bold text-slate-900">Bật theo dõi ngay sau khi tạo</p>
            <p className="text-[11px] text-slate-400">
              Hệ thống sẽ thực hiện lượt kiểm tra HTTP và SSL đầu tiên ngay lập tức
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnableMonitoring(!enableMonitoring)}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${
              enableMonitoring ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white transition-transform transform shadow-sm ${
                enableMonitoring ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/websites"
            className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? "Đang xử lý..." : "Thêm website"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
