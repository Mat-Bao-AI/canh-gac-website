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
    const websiteId = searchParams.get("websiteId");
    const status = searchParams.get("status"); // OPEN, RESOLVED, ALL
    const search = searchParams.get("search");

    const whereClause: Record<string, unknown> = {
      website: { userId: user.id },
    };

    if (websiteId && websiteId !== "ALL") {
      whereClause.websiteId = websiteId;
    }

    if (status && status !== "ALL") {
      whereClause.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      whereClause.OR = [
        { cause: { contains: search.trim() } },
        { website: { name: { contains: search.trim() } } },
      ];
    }

    const incidents = await prisma.incident.findMany({
      where: whereClause,
      include: {
        website: {
          select: { id: true, name: true, url: true, status: true },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: incidents,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
    return NextResponse.json(
      { success: false, message: errMsg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
