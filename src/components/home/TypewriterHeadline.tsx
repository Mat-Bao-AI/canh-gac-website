"use client";

import React, { useState, useEffect } from "react";

const PHRASES = [
  "Độ tin cậy hạ tầng tuyệt đối",
  "Cảnh báo Telegram tức thì",
  "Đo lường độ trễ mili-giây",
  "Giám sát Uptime & SSL 24/7",
  "Phát hiện sự cố trước khách hàng",
];

export function TypewriterHeadline() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = PHRASES[phraseIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      // Đang gõ chữ (typing)
      if (displayText.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        }, 60);
      } else {
        // Gõ xong -> Dừng lại để người dùng đọc
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      // Đang xóa chữ (deleting)
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length - 1));
        }, 30);
      } else {
        // Xóa xong -> Chuyển sang cụm từ tiếp theo
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex]);

  return (
    <span className="inline-block relative">
      <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
        {displayText}
      </span>
      {/* Con trỏ nhấp nháy công nghệ cao chuẩn tỷ lệ font */}
      <span
        aria-hidden="true"
        className="inline-block w-0.5 sm:w-1 h-[0.8em] bg-blue-600 ml-1.5 rounded-full animate-pulse align-baseline"
      />
    </span>
  );
}
