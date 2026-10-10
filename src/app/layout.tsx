import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canh Gác Website - Nền tảng Giám sát Website Uptime, SSL & An ninh 24/7",
  description:
    "Giám sát website 24/7, phát hiện sự cố downtime, SSL hết hạn, thời gian phản hồi chậm và dấu hiệu bất thường trước khi khách hàng của bạn phát hiện.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 font-sans">{children}</body>
    </html>
  );
}
