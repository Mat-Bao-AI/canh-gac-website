import { NextRequest, NextResponse } from "next/server";
import { getApiUser, comparePassword } from "@/lib/auth";
import { verifyTOTP, verifyAndConsumeRecoveryCode } from "@/lib/totp";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const apiUser = await getApiUser(req);
    if (!apiUser) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const { code, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: apiUser.id },
    });

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json({ success: false, message: "Tài khoản chưa bật xác thực 2 bước" }, { status: 400 });
    }

    let isAuthorized = false;

    // 1. Kiểm tra bằng mã TOTP nếu có nhập
    if (code && user.twoFactorSecret) {
      const cleanCode = String(code).trim();
      if (verifyTOTP(cleanCode, user.twoFactorSecret)) {
        isAuthorized = true;
      } else if (user.twoFactorRecoveryCodes) {
        try {
          const stored: string[] = JSON.parse(user.twoFactorRecoveryCodes);
          const res = verifyAndConsumeRecoveryCode(cleanCode, stored);
          if (res.valid) isAuthorized = true;
        } catch {
          // Ignored
        }
      }
    }

    // 2. Hoặc kiểm tra bằng mật khẩu tài khoản
    if (!isAuthorized && password) {
      isAuthorized = await comparePassword(password, user.passwordHash);
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: "Mã OTP hoặc mật khẩu xác nhận không chính xác" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã hủy kích hoạt xác thực 2 bước thành công",
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi máy chủ";
    return NextResponse.json({ success: false, message: errMsg }, { status: 500 });
  }
}
