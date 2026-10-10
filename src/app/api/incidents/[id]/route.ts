import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Chưa đăng nhập", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const incident = await prisma.incident.findUnique({
      where: { id: params.id },
      include: {
        website: true,
        notifications: {
          orderBy: { sentAt: "asc" },
        },
      },
    });

    if (!incident || incident.website.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sự cố", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Build timeline items
    const timeline = [];
    timeline.push({
      time: incident.startedAt,
      event: "Phát hiện sự cố lần đầu",
      description: `Hệ thống ghi nhận lỗi: ${incident.cause}`,
      type: "DANGER",
    });

    for (const notif of incident.notifications) {
      timeline.push({
        time: notif.sentAt,
        event: `Đã gửi cảnh báo qua ${notif.channel}`,
        description: notif.messageBody.split("\n")[0] || "Cảnh báo được gửi",
        type: notif.eventType === "RECOVERY" ? "SUCCESS" : "WARNING",
      });
    }

    if (incident.resolvedAt) {
      timeline.push({
        time: incident.resolvedAt,
        event: "Website đã phục hồi hoạt động bình thường",
        description: `Thời gian gián đoạn: ${Math.round((incident.durationSeconds || 0) / 60)} phút`,
        type: "SUCCESS",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...incident,
        timeline,
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
