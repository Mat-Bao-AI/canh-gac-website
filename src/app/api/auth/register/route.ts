import { NextRequest, NextResponse } from "next/server";
import { hashPassword, signToken, COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự để đảm bảo an toàn"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

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

    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Email này đã được đăng ký tài khoản",
          code: "EMAIL_EXISTS",
        },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        settings: {
          create: {
            telegramEnabled: true,
            alertDown: true,
            alertRecovery: true,
          },
        },
      },
    });

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Đăng ký tài khoản thành công",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
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
