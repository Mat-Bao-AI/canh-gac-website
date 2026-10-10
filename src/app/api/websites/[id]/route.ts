import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateUrlAgainstSSRF } from "@/lib/ssrf";
import { evaluateWebsiteState } from "@/lib/staleness";
import { z } from "zod";

const updateWebsiteSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  checkInterval: z.number().int().min(60).optional(),
  expectedStatusCode: z.number().int().optional(),
  expectedKeyword: z.string().optional().nullable(),
  responseThresholdMs: z.number().int().optional(),
  currentState: z.enum(["ACTIVE", "PAUSED"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Chưa đăng nhập", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const website = await prisma.website.findUnique({
      where: { id: params.id },
      include: {
        incidents: {
          orderBy: { startedAt: "desc" },
          take: 10,
        },
        securityScans: {
          orderBy: { scannedAt: "desc" },
          take: 5,
        },
        _count: {
          select: { checkLogs: true, incidents: true },
        },
      },
    });

    if (!website || website.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy website", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // 1. Worker Heartbeat and dynamic state evaluation
    const workerHeartbeat = await prisma.workerHeartbeat.findUnique({
      where: { id: "primary-worker" },
    });

    const isWorkerActive = workerHeartbeat
      ? Date.now() - new Date(workerHeartbeat.lastHeartbeatAt).getTime() < 45000
      : false;

    const evaluation = evaluateWebsiteState(website, workerHeartbeat);

    // 2. Fetch latest check log for network timing breakdown
    const latestCheckLog = await prisma.checkLog.findFirst({
      where: { websiteId: website.id },
      orderBy: { checkedAt: "desc" },
    });

    // 3. Calculate 7-day uptime strictly from database records
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const totalLogs7d = await prisma.checkLog.count({
      where: {
        websiteId: website.id,
        checkedAt: { gte: sevenDaysAgo },
      },
    });

    const successfulLogs7d = await prisma.checkLog.count({
      where: {
        websiteId: website.id,
        checkedAt: { gte: sevenDaysAgo },
        isSuccessful: true,
      },
    });

    const uptime7d =
      totalLogs7d > 0
        ? Number(((successfulLogs7d / totalLogs7d) * 100).toFixed(2))
        : null;

    return NextResponse.json({
      success: true,
      data: {
        ...website,
        displayStatus: evaluation.displayStatus,
        statusReason: evaluation.evidence,
        isStale: evaluation.isStale,
        uptime7d,
        totalChecks7d: totalLogs7d,
        latestCheckLog,
        worker: {
          isActive: isWorkerActive,
          lastHeartbeatAt: workerHeartbeat?.lastHeartbeatAt || null,
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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Chưa đăng nhập", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const website = await prisma.website.findUnique({
      where: { id: params.id },
    });

    if (!website || website.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy website", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const result = updateWebsiteSchema.safeParse(body);

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

    const data = result.data;

    if (data.url && data.url !== website.url) {
      const ssrfCheck = await validateUrlAgainstSSRF(data.url);
      if (!ssrfCheck.isValid) {
        return NextResponse.json(
          {
            success: false,
            message: ssrfCheck.error || "URL bị từ chối bởi bộ lọc an ninh SSRF",
            code: "SSRF_BLOCKED",
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.website.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật website thành công",
      data: updated,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
    return NextResponse.json(
      { success: false, message: errMsg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Chưa đăng nhập", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const website = await prisma.website.findUnique({
      where: { id: params.id },
    });

    if (!website || website.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy website", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    await prisma.website.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa website thành công",
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
    return NextResponse.json(
      { success: false, message: errMsg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
