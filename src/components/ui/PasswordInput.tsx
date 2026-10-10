"use client";

import React, { useState, useId } from "react";
import { Eye, EyeOff, Sparkles, Check, X, Copy, CheckCheck, Lock } from "lucide-react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  required?: boolean;
  showStrengthMeter?: boolean;
  label?: string;
  autoComplete?: string;
}

export function generateSecurePassword(length = 16): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|";

  // Đảm bảo có ít nhất 2 ký tự của mỗi loại
  let password = "";
  const getRandom = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

  password += getRandom(upper) + getRandom(upper);
  password += getRandom(lower) + getRandom(lower);
  password += getRandom(digits) + getRandom(digits);
  password += getRandom(symbols) + getRandom(symbols);

  const all = upper + lower + digits + symbols;
  while (password.length < length) {
    password += getRandom(all);
  }

  // Shuffle ký tự
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export function evaluatePasswordStrength(password: string): {
  score: number; // 0 to 4
  label: string;
  colorClass: string;
  bgClass: string;
  checks: {
    length: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
} {
  const checks = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };

  let score = 0;
  if (checks.length) score += 1;
  if (password.length >= 12) score += 0.5;
  if (checks.hasUpper && checks.hasLower) score += 1;
  if (checks.hasNumber) score += 0.75;
  if (checks.hasSymbol) score += 0.75;

  const normalized = Math.min(4, Math.floor(score));

  switch (normalized) {
    case 0:
    case 1:
      return { score: 1, label: "Yếu", colorClass: "text-rose-600", bgClass: "bg-rose-500", checks };
    case 2:
      return { score: 2, label: "Trung bình", colorClass: "text-amber-600", bgClass: "bg-amber-500", checks };
    case 3:
      return { score: 3, label: "Mạnh", colorClass: "text-emerald-600", bgClass: "bg-emerald-500", checks };
    case 4:
    default:
      return { score: 4, label: "Rất mạnh (Khuyên dùng)", colorClass: "text-indigo-600", bgClass: "bg-indigo-600", checks };
  }
}

export function PasswordInput({
  value,
  onChange,
  placeholder = "Nhập mật khẩu an toàn",
  id,
  name = "password",
  required = true,
  showStrengthMeter = true,
  label,
  autoComplete = "new-password",
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const strength = evaluatePasswordStrength(value);

  const handleGenerate = () => {
    const newPass = generateSecurePassword(16);
    onChange(newPass);
    setShowPassword(true);
  };

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
          <button
            type="button"
            onClick={handleGenerate}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition group"
            title="Tự động tạo mật khẩu mạnh chuẩn an toàn"
          >
            <Sparkles className="w-3 h-3 text-blue-500 group-hover:scale-110 transition-transform" />
            <span>Tạo mật khẩu mạnh</span>
          </button>
        </div>
      )}

      <div className="relative">
        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={inputId}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              title="Sao chép mật khẩu"
            >
              {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {showStrengthMeter && value.length > 0 && (
        <div className="space-y-2 pt-1 animate-fadeIn">
          {/* Thanh đo độ mạnh */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Độ bảo mật:</span>
            <span className={`font-bold ${strength.colorClass}`}>{strength.label}</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 h-1.5">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`rounded-full transition-all duration-300 ${
                  strength.score >= step ? strength.bgClass : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Checklist tiêu chí */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              {strength.checks.length ? (
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <X className="w-3 h-3 text-slate-300 shrink-0" />
              )}
              <span className={strength.checks.length ? "text-emerald-700 font-medium" : "text-slate-400"}>
                Tối thiểu 8 ký tự
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {strength.checks.hasUpper && strength.checks.hasLower ? (
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <X className="w-3 h-3 text-slate-300 shrink-0" />
              )}
              <span
                className={
                  strength.checks.hasUpper && strength.checks.hasLower
                    ? "text-emerald-700 font-medium"
                    : "text-slate-400"
                }
              >
                Chữ hoa & chữ thường
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {strength.checks.hasNumber ? (
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <X className="w-3 h-3 text-slate-300 shrink-0" />
              )}
              <span className={strength.checks.hasNumber ? "text-emerald-700 font-medium" : "text-slate-400"}>
                Chứa ít nhất 1 chữ số
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {strength.checks.hasSymbol ? (
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <X className="w-3 h-3 text-slate-300 shrink-0" />
              )}
              <span className={strength.checks.hasSymbol ? "text-emerald-700 font-medium" : "text-slate-400"}>
                Ký tự đặc biệt (!@#$)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
