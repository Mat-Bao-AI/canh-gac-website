import { NextRequest, NextResponse } from "next/server";
import { comparePassword, signToken, COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error.errors[0].message,
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Email hoặc mật khẩu không chính xác",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Email hoặc mật khẩu không chính xác",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    // Nếu tài khoản đã bật 2FA, yêu cầu bước nhập mã Authenticator
    if (user.twoFactorEnabled) {
      const { sign2FATempToken } = await import("@/lib/auth");
      const tempToken = sign2FATempToken(user.id);
      return NextResponse.json({
        success: true,
        requires2FA: true,
        tempToken,
        message: "Vui lòng nhập mã xác thực 2 bước (2FA / Authenticator)",
      });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Đăng nhập thành công",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      token,
    });

    // Set HTTP-only session cookie
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
    const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
    return NextResponse.json(
      {
        success: false,
        message: errMsg,
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
