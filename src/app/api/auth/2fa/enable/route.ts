import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { verifyTOTP } from "@/lib/totp";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const { secret, code, recoveryCodes } = await req.json();

    if (!secret || !code) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin khóa bí mật hoặc mã OTP" },
        { status: 400 }
      );
    }

    // Xác thực mã 6 số với Secret chuẩn bị bật
    const isValid = verifyTOTP(String(code).trim(), secret);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Mã 6 chữ số không chính xác hoặc đã hết hạn" },
        { status: 400 }
      );
    }

    // Lưu vào database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorRecoveryCodes: Array.isArray(recoveryCodes) ? JSON.stringify(recoveryCodes) : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã kích hoạt xác thực 2 bước (2FA) thành công cho tài khoản!",
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi máy chủ";
    return NextResponse.json({ success: false, message: errMsg }, { status: 500 });
  }
}
