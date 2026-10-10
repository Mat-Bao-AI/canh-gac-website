import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { sendTelegramMessage } from "@/lib/telegram";
import { z } from "zod";

const testTelegramSchema = z.object({
  botToken: z.string().min(1, "Vui lòng nhập Bot Token"),
  chatId: z.string().min(1, "Vui lòng nhập Chat ID"),
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

    const body = await req.json();
    const result = testTelegramSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.errors[0].message, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { botToken, chatId } = result.data;

    const message = `<b>[CANH GÁC WEBSITE - KIỂM TRA KẾT NỐI]</b>\n\nXin chào ${user.name}!\nRobot thông báo Telegram đã kết nối thành công với tài khoản của bạn trên nền tảng Canh Gác Website.\n\nThời gian: ${new Date().toLocaleString("vi-VN")}\nTrạng thái: Hoạt động bình thường.`;

    const sendRes = await sendTelegramMessage({
      botToken,
      chatId,
      message,
    });

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

    return NextResponse.json({
      success: true,
      message: "Telegram đã kết nối và gửi tin nhắn kiểm tra thành công!",
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
    return NextResponse.json(
      { success: false, message: errMsg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
