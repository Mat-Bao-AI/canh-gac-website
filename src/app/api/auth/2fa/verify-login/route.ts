import { NextRequest, NextResponse } from "next/server";
import { verify2FATempToken, signToken, COOKIE_NAME } from "@/lib/auth";
import { verifyTOTP, verifyAndConsumeRecoveryCode } from "@/lib/totp";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { tempToken, code } = await req.json();

    if (!tempToken || !code) {
      return NextResponse.json(
        { success: false, message: "Thiếu mã xác thực hoặc phiên đăng nhập đã hết hạn" },
        { status: 400 }
      );
    }

    const payload = verify2FATempToken(tempToken);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Phiên xác thực 2 bước đã hết hạn. Vui lòng đăng nhập lại." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { success: false, message: "Tài khoản chưa cấu hình xác thực 2 bước" },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim();
    let isValid = verifyTOTP(cleanCode, user.twoFactorSecret);
    let usedRecoveryCode = false;

    // Nếu không khớp mã TOTP 6 số, thử kiểm tra mã khôi phục dự phòng (Recovery Code)
    if (!isValid && user.twoFactorRecoveryCodes) {
      try {
        const storedCodes: string[] = JSON.parse(user.twoFactorRecoveryCodes);
        const recoveryResult = verifyAndConsumeRecoveryCode(cleanCode, storedCodes);
        if (recoveryResult.valid) {
          isValid = true;
          usedRecoveryCode = true;
          // Cập nhật danh sách mã dự phòng còn lại
          await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorRecoveryCodes: JSON.stringify(recoveryResult.remainingCodes) },
          });
        }
      } catch {
        // Ignored
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Mã xác thực không đúng hoặc đã hết hạn" },
        { status: 401 }
      );
    }

    // Đăng nhập thành công, cấp session token
    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      message: usedRecoveryCode
        ? "Đăng nhập thành công bằng mã khôi phục dự phòng"
        : "Xác thực 2 bước thành công",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      token,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi máy chủ";
    return NextResponse.json({ success: false, message: errMsg }, { status: 500 });
  }
}
