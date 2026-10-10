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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const range = searchParams.get("range") || "7d"; // 1h, 6h, 24h, 7d, 30d

    let hours = 7 * 24;
    if (range === "1h") hours = 1;
    else if (range === "6h") hours = 6;
    else if (range === "24h") hours = 24;
    else if (range === "7d") hours = 7 * 24;
    else if (range === "30d") hours = 30 * 24;

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const logs = await prisma.checkLog.findMany({
      where: {
        websiteId: params.id,
        website: { userId: user.id },
        checkedAt: { gte: since },
      },
      orderBy: { checkedAt: "desc" },
      take: limit,
    });

    // Format chart series
    const chartData = logs
      .slice()
      .reverse()
      .map((l) => ({
        time: l.checkedAt.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
        }),
        responseTime: l.responseTimeMs,
        status: l.httpStatus,
        isSuccessful: l.isSuccessful,
      }));

    return NextResponse.json({
      success: true,
      data: {
        logs,
        chartData,
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
