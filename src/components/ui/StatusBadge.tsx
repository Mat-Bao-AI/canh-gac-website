import React from "react";

interface StatusBadgeProps {
  status: string; // UP, DEGRADED, WARNING, DOWN, PAUSED, UNKNOWN
  labelOverride?: string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, labelOverride, className = "", size = "md" }: StatusBadgeProps) {
  const norm = (status || "UNKNOWN").toUpperCase();

  let bg = "bg-slate-100 text-slate-700 border-slate-200";
  let dot = "bg-slate-400";
  let label = labelOverride || "Không xác định";

  if (norm === "UP") {
    bg = "bg-emerald-50 text-emerald-700 border-emerald-200";
    dot = "bg-emerald-500";
    label = labelOverride || "Hoạt động";
  } else if (norm === "DEGRADED" || norm === "WARNING") {
    bg = "bg-amber-50 text-amber-700 border-amber-200";
    dot = "bg-amber-500";
    label = labelOverride || "Cảnh báo";
  } else if (norm === "DOWN") {
    bg = "bg-rose-50 text-rose-700 border-rose-200";
    dot = "bg-rose-500";
    label = labelOverride || "Gặp lỗi";
  } else if (norm === "PAUSED") {
    bg = "bg-slate-100 text-slate-600 border-slate-200";
    dot = "bg-slate-400";
    label = labelOverride || "Tạm dừng";
  } else if (norm === "UNKNOWN") {
    bg = "bg-slate-100 text-slate-700 border-slate-300";
    dot = "bg-slate-400";
    label = labelOverride || "Không xác định";
  }

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${bg} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${norm === "DOWN" ? "animate-pulse" : ""}`} />
      <span>{label}</span>
    </span>
  );
}
