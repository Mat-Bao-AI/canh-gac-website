import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram";
import { z } from "zod";

const testTelegramSchema = z.object({
  botToken: z.string().optional().nullable(),
  chatId: z.string().optional().nullable(),
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
      // Empty body allowed to fallback
    }

    const result = testTelegramSchema.safeParse(bodyData);
    const input = result.success ? result.data : {};

    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    const botToken =
      (input.botToken?.trim()) ||
      userSettings?.telegramBotToken ||
      process.env.TELEGRAM_BOT_TOKEN;

    const chatId =
      (input.chatId?.trim()) ||
      userSettings?.telegramChatId ||
      process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json(
        {
          success: false,
          message: "Vui lòng nhập Telegram Bot Token và Chat ID (hoặc cài đặt trong biến môi trường TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID).",
          code: "MISSING_CONFIG",
        },
        { status: 400 }
      );
    }

    const message = `<b>[CANH GÁC WEBSITE - KIỂM TRA KẾT NỐI]</b>\n\nXin chào ${user.name}!\nRobot thông báo Telegram đã kết nối thành công với tài khoản của bạn trên nền tảng Canh Gác Website.\n\nThời gian: ${new Date().toLocaleString("vi-VN")}\nTrạng thái: Hoạt động bình thường.`;

    const sendRes = await sendTelegramMessage({
      botToken,
      chatId,
      message,
    });

    // Write to NotificationHistory if user has a website
    const firstWebsite = await prisma.website.findFirst({
      where: { userId: user.id },
    });

    if (firstWebsite) {
      try {
        await prisma.notificationHistory.create({
          data: {
            websiteId: firstWebsite.id,
            eventType: "TEST",
            channel: "TELEGRAM",
            messageBody: `[Telegram Test] Tin nhắn kiểm tra kết nối tới Chat ID ${chatId}`,
            status: sendRes.success ? "SENT" : "FAILED",
            errorMessage: sendRes.error || null,
          },
        });
      } catch (histErr) {
        console.error("Failed to write notification history for Telegram test:", histErr);
      }
    }

    if (!sendRes.success) {
      return NextResponse.json(
        {
          success: false,
          message: `Không thể gửi tin nhắn kiểm tra: ${sendRes.error}`,
          code: "TELEGRAM_SEND_FAILED",
        },
        { status: 400 }
      );
    }

    // Auto-save and enable telegram
    try {
      await prisma.userSettings.upsert({
        where: { userId: user.id },
        update: {
          telegramBotToken: botToken,
          telegramChatId: chatId,
          telegramEnabled: true,
        },
        create: {
          userId: user.id,
          telegramBotToken: botToken,
          telegramChatId: chatId,
          telegramEnabled: true,
        },
      });
    } catch {
      // Ignored
    }

    return NextResponse.json({
      success: true,
      message: "🎉 Telegram đã kết nối và gửi tin nhắn kiểm tra thành công! Hệ thống đã tự động kích hoạt kênh cảnh báo Telegram.",
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
    return NextResponse.json(
      { success: false, message: errMsg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

