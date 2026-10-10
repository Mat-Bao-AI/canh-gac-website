import React from "react";
import { Globe } from "lucide-react";

interface WebsiteAvatarProps {
  name: string;
  url?: string;
  size?: "sm" | "md" | "lg";
}

export function WebsiteAvatar({ name, size = "md" }: WebsiteAvatarProps) {
  const initial = name ? name.replace(/^https?:\/\//, "").charAt(0).toUpperCase() : "W";

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  }[size];

  return (
    <div
      className={`${sizeClasses} rounded-lg bg-blue-50 border border-blue-100 text-blue-600 font-semibold flex items-center justify-center shrink-0 shadow-xs`}
    >
      {initial || <Globe className="w-4 h-4" />}
    </div>
  );
}
