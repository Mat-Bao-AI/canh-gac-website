import React from "react";
import { Lock, AlertTriangle, ShieldCheck } from "lucide-react";

interface SSLBadgeProps {
  daysRemaining?: number | null;
  sslValid?: boolean | null;
  className?: string;
}

export function SSLBadge({ daysRemaining, sslValid, className = "" }: SSLBadgeProps) {
  if (daysRemaining === undefined || daysRemaining === null) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-slate-500 ${className}`}>
        <Lock className="w-3.5 h-3.5 text-slate-400" />
        <span>Chưa kiểm tra</span>
      </span>
    );
  }

  if (daysRemaining <= 0 || sslValid === false) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium text-rose-600 ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
        <span>Đã hết hạn</span>
      </span>
    );
  }

  if (daysRemaining <= 15) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium text-amber-600 ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        <span>Còn {daysRemaining} ngày</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs text-slate-600 ${className}`}>
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
      <span>Còn {daysRemaining} ngày</span>
    </span>
  );
}
