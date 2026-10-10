import { NextRequest, NextResponse } from "next/server";
import { getApiUser, hashPassword, comparePassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSettingsSchema = z.object({
  // Profile
  name: z.string().min(2).optional(),
  avatar: z.string().optional(),
  
  // Password change
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),

  // Notifications
  telegramBotToken: z.string().optional().nullable(),
  telegramChatId: z.string().optional().nullable(),
  telegramEnabled: z.boolean().optional(),
  smtpHost: z.string().optional().nullable(),
  smtpPort: z.number().int().optional().nullable(),
  smtpUser: z.string().optional().nullable(),
  smtpPass: z.string().optional().nullable(),
  fromEmail: z.string().optional().nullable(),
  emailEnabled: z.boolean().optional(),

  // Rules
  alertDown: z.boolean().optional(),
  alertRecovery: z.boolean().optional(),
  repeatAlertHours: z.number().int().min(0).max(168).optional(),
  sslWarningDays: z.number().int().optional(),
  slowResponseEnabled: z.boolean().optional(),
  slowResponseThreshold: z.number().int().optional(),
  defaultCheckInterval: z.number().int().optional(),
  retryThreshold: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Chưa đăng nhập", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
        settings: settings || {
          telegramEnabled: true,
          alertDown: true,
          alertRecovery: true,
          repeatAlertHours: 1,
          sslWarningDays: 15,
          slowResponseEnabled: true,
          slowResponseThreshold: 2000,
          defaultCheckInterval: 300,
          retryThreshold: 2,
        },
      },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
    return NextResponse.json(
      { success: false, message: errMsg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Chưa đăng nhập", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = updateSettingsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.errors[0].message, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const data = result.data;

    // Handle Profile Name & Avatar
    if (data.name || data.avatar) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: data.name || user.name,
          avatar: data.avatar || user.avatar,
        },
      });
    }

    // Handle Password Change if requested
    if (data.newPassword) {
      if (!data.currentPassword) {
        return NextResponse.json(
          { success: false, message: "Vui lòng nhập mật khẩu hiện tại", code: "MISSING_PASSWORD" },
          { status: 400 }
        );
      }

      const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!fullUser) throw new Error("User not found");

      const isMatch = await comparePassword(data.currentPassword, fullUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: "Mật khẩu hiện tại không chính xác", code: "WRONG_PASSWORD" },
          { status: 400 }
        );
      }

      const newHash = await hashPassword(data.newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
    }

    // Handle User Settings
    const settingsUpdateData: Record<string, unknown> = {};
    if (data.telegramBotToken !== undefined) settingsUpdateData.telegramBotToken = data.telegramBotToken;
    if (data.telegramChatId !== undefined) settingsUpdateData.telegramChatId = data.telegramChatId;
    if (data.telegramEnabled !== undefined) settingsUpdateData.telegramEnabled = data.telegramEnabled;
    if (data.smtpHost !== undefined) settingsUpdateData.smtpHost = data.smtpHost;
    if (data.smtpPort !== undefined) settingsUpdateData.smtpPort = data.smtpPort;
    if (data.smtpUser !== undefined) settingsUpdateData.smtpUser = data.smtpUser;
    if (data.smtpPass !== undefined) settingsUpdateData.smtpPass = data.smtpPass;
    if (data.fromEmail !== undefined) settingsUpdateData.fromEmail = data.fromEmail;
    if (data.emailEnabled !== undefined) settingsUpdateData.emailEnabled = data.emailEnabled;
    if (data.alertDown !== undefined) settingsUpdateData.alertDown = data.alertDown;
    if (data.alertRecovery !== undefined) settingsUpdateData.alertRecovery = data.alertRecovery;
    if (data.repeatAlertHours !== undefined) settingsUpdateData.repeatAlertHours = data.repeatAlertHours;
    if (data.sslWarningDays !== undefined) settingsUpdateData.sslWarningDays = data.sslWarningDays;
    if (data.slowResponseEnabled !== undefined) settingsUpdateData.slowResponseEnabled = data.slowResponseEnabled;
    if (data.slowResponseThreshold !== undefined) settingsUpdateData.slowResponseThreshold = data.slowResponseThreshold;
    if (data.defaultCheckInterval !== undefined) settingsUpdateData.defaultCheckInterval = data.defaultCheckInterval;
    if (data.retryThreshold !== undefined) settingsUpdateData.retryThreshold = data.retryThreshold;

    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: settingsUpdateData,
      create: {
        userId: user.id,
        ...settingsUpdateData,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật cài đặt thành công",
      data: updatedSettings,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
    return NextResponse.json(
      { success: false, message: errMsg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
