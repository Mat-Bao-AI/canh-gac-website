import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendSmtpEmail, formatTestEmail } from "@/lib/email";
import { z } from "zod";

const testEmailSchema = z.object({
  smtpHost: z.string().optional().nullable(),
  smtpPort: z.number().int().optional().nullable(),
  smtpUser: z.string().optional().nullable(),
  smtpPass: z.string().optional().nullable(),
  toEmail: z.string().email("Địa chỉ email nhận không hợp lệ").optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Chưa đăng nhập", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    let bodyData: Record<string, unknown> = {};
    try {
      bodyData = await req.json();
    } catch {
      // Empty body allowed to fallback to saved settings or env
    }

    const result = testEmailSchema.safeParse(bodyData);
    const input = result.success ? result.data : {};

    // Fetch user's saved settings
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    const smtpHost =
      (input.smtpHost?.trim()) ||
      userSettings?.smtpHost ||
      process.env.SMTP_HOST ||
      "smtp.gmail.com";

    const smtpPort =
      input.smtpPort ||
      userSettings?.smtpPort ||
      (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587);

    const smtpUser =
      (input.smtpUser?.trim()) ||
      userSettings?.smtpUser ||
      process.env.SMTP_USER ||
      "";

    const smtpPass =
      (input.smtpPass?.trim()) ||
      userSettings?.smtpPass ||
      process.env.SMTP_PASSWORD ||
      "";

    const recipientEmail =
      (input.toEmail?.trim()) ||
      user.email ||
      smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Vui lòng điền đầy đủ SMTP Host, SMTP Username và SMTP Password (hoặc cài đặt trong biến môi trường SMTP_USER / SMTP_PASSWORD).",
          code: "MISSING_SMTP_CONFIG",
        },
        { status: 400 }
      );
    }

    const timeString = new Date().toLocaleString("vi-VN");
    const { subject, html } = formatTestEmail({
      userName: user.name,
      timeString,
      smtpHost,
      smtpUser,
    });

    const sendRes = await sendSmtpEmail({
      config: {
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        pass: smtpPass,
        from: smtpUser,
      },
      to: recipientEmail,
      subject,
      html,
    });

    // Find any website belonging to the user to associate the notification history
    const firstWebsite = await prisma.website.findFirst({
      where: { userId: user.id },
    });

    if (firstWebsite) {
      try {
        await prisma.notificationHistory.create({
          data: {
            websiteId: firstWebsite.id,
            eventType: "TEST",
            channel: "EMAIL",
            messageBody: `[Email Test] ${subject} -> Gửi tới: ${recipientEmail}`,
            status: sendRes.success ? "SENT" : "FAILED",
            errorMessage: sendRes.error || null,
          },
        });
      } catch (histErr) {
        console.error("Failed to write notification history for test email:", histErr);
      }
    }

    if (!sendRes.success) {
      let friendlyError = sendRes.error || "Không thể kết nối máy chủ SMTP";
      if (friendlyError.includes("535") || friendlyError.includes("BadCredentials") || friendlyError.includes("Username and Password not accepted")) {
        friendlyError =
          "Tài khoản hoặc mật khẩu SMTP không đúng. Lưu ý: Với Gmail, bạn phải bật 'Xác minh 2 bước' và tạo 'Mật khẩu ứng dụng' (App Password) 16 chữ cái, không dùng mật khẩu đăng nhập Google thông thường.";
      } else if (friendlyError.includes("ETIMEDOUT") || friendlyError.includes("ECONNREFUSED")) {
        friendlyError = `Không thể kết nối tới máy chủ ${smtpHost}:${smtpPort}. Vui lòng kiểm tra lại Host và Port (Khuyên dùng port 587).`;
      }

      return NextResponse.json(
        {
          success: false,
          message: `Lỗi gửi email: ${friendlyError}`,
          rawError: sendRes.error,
          code: "SMTP_CONNECTION_FAILED",
        },
        { status: 400 }
      );
    }

    // Auto-save settings and enable email on successful test if requested
    try {
      await prisma.userSettings.upsert({
        where: { userId: user.id },
        update: {
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPass,
          emailEnabled: true,
        },
        create: {
          userId: user.id,
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPass,
          emailEnabled: true,
        },
      });
    } catch {
      // Ignored
    }

    return NextResponse.json({
      success: true,
      message: `🎉 Email kiểm tra đã được gửi thành công đến hộp thư: ${recipientEmail}. Hệ thống đã tự động kích hoạt kênh cảnh báo Email!`,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi gửi email kiểm tra";
    return NextResponse.json(
      { success: false, message: errMsg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

