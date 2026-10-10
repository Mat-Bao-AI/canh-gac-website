import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Chưa đăng nhập", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "ALL"; // ALL, DOWN, RECOVERY, SSL, SECURITY

    const whereClause: Record<string, unknown> = {
      website: { userId: user.id },
    };

    if (tab === "DOWN") {
      whereClause.eventType = "DOWN";
    } else if (tab === "RECOVERY") {
      whereClause.eventType = "RECOVERY";
    } else if (tab === "SSL") {
      whereClause.eventType = "SSL_WARNING";
    } else if (tab === "SECURITY") {
      whereClause.eventType = "ANOMALY";
    }

    const alerts = await prisma.notificationHistory.findMany({
      where: whereClause,
      include: {
        website: {
          select: { id: true, name: true, url: true, status: true },
        },
      },
      orderBy: { sentAt: "desc" },
      take: 100,
    });

    // Counts for tab badges
    const allAlerts = await prisma.notificationHistory.findMany({
      where: { website: { userId: user.id } },
      select: { eventType: true },
    });

    const counts = {
      all: allAlerts.length,
      down: allAlerts.filter((a) => a.eventType === "DOWN").length,
      recovery: allAlerts.filter((a) => a.eventType === "RECOVERY").length,
      ssl: allAlerts.filter((a) => a.eventType === "SSL_WARNING").length,
      security: allAlerts.filter((a) => a.eventType === "ANOMALY").length,
    };

    return NextResponse.json({
      success: true,
      data: alerts,
      counts,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
    return NextResponse.json(
      { success: false, message: errMsg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
