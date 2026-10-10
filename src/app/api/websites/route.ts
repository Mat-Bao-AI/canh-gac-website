import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateUrlAgainstSSRF } from "@/lib/ssrf";
import { executeWebsiteCheck } from "@/lib/checker";
import { evaluateWebsiteState } from "@/lib/staleness";
import { z } from "zod";

const createWebsiteSchema = z.object({
  url: z.string().url("URL không hợp lệ"),
  name: z.string().min(1, "Vui lòng nhập tên website"),
  checkInterval: z.number().int().min(60).default(300),
  expectedStatusCode: z.number().int().default(200),
  expectedKeyword: z.string().optional().nullable(),
  responseThresholdMs: z.number().int().default(2000),
  enableMonitoring: z.boolean().default(true),
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

    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get("status"); // all, UP, DEGRADED, DOWN, UNKNOWN, PAUSED
    const search = searchParams.get("search") || "";

    const workerHeartbeat = await prisma.workerHeartbeat.findUnique({
      where: { id: "primary-worker" },
    });

    const whereClause: Record<string, unknown> = {
      userId: user.id,
    };

    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search.trim() } },
        { url: { contains: search.trim() } },
      ];
    }

    const allWebsites = await prisma.website.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { incidents: true, checkLogs: true },
        },
      },
    });

    // Evaluate dynamic state with worker heartbeat & staleness
    const evaluatedWebsites = allWebsites.map((w) => {
      const evaluation = evaluateWebsiteState(w, workerHeartbeat);
      return {
        ...w,
        displayStatus: evaluation.displayStatus,
        statusReason: evaluation.evidence,
        isStale: evaluation.isStale,
      };
    });

    // Counts for tab badges based on real evaluated states
    const counts = {
      all: evaluatedWebsites.length,
      up: evaluatedWebsites.filter((w) => w.displayStatus === "UP").length,
      degraded: evaluatedWebsites.filter((w) => w.displayStatus === "DEGRADED").length,
      down: evaluatedWebsites.filter((w) => w.displayStatus === "DOWN").length,
      unknown: evaluatedWebsites.filter((w) => w.displayStatus === "UNKNOWN").length,
      paused: evaluatedWebsites.filter((w) => w.displayStatus === "PAUSED").length,
    };

    // Filter websites if tab is specified
    let filtered = evaluatedWebsites;
    if (filterStatus && filterStatus.toUpperCase() !== "ALL") {
      filtered = evaluatedWebsites.filter(
        (w) => w.displayStatus.toUpperCase() === filterStatus.toUpperCase()
      );
    }

    return NextResponse.json({
      success: true,
      data: filtered,
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

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Chưa đăng nhập", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = createWebsiteSchema.safeParse(body);

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

    const { url, name, checkInterval, expectedStatusCode, expectedKeyword, responseThresholdMs, enableMonitoring } =
      result.data;

    // 1. SSRF Protection Validation
    const ssrfResult = await validateUrlAgainstSSRF(url);
    if (!ssrfResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: ssrfResult.error || "URL bị từ chối bởi bộ lọc an ninh SSRF",
          code: "SSRF_BLOCKED",
        },
        { status: 400 }
      );
    }

    // 2. Create Website record in DB (Initial status is UNKNOWN until verified)
    const newWebsite = await prisma.website.create({
      data: {
        userId: user.id,
        name,
        url,
        checkInterval,
        expectedStatusCode,
        expectedKeyword,
        responseThresholdMs,
        status: "UNKNOWN",
        statusReason: "Đang chờ worker thực hiện lượt kiểm tra đầu tiên",
        currentState: enableMonitoring ? "ACTIVE" : "PAUSED",
      },
    });

    // 3. Queue / trigger first check immediately if active
    if (enableMonitoring) {
      try {
        const checkResult = await executeWebsiteCheck({
          url,
          expectedStatusCode,
          expectedKeyword,
          responseThresholdMs,
          checkSSL: true,
          checkAnomaly: true,
        });

        await prisma.checkLog.create({
          data: {
            websiteId: newWebsite.id,
            checkedAt: checkResult.checkedAt,
            httpStatus: checkResult.httpStatus,
            responseTimeMs: checkResult.responseTimeMs,
            dnsTimeMs: checkResult.dnsTimeMs,
            connectTimeMs: checkResult.connectTimeMs,
            tlsTimeMs: checkResult.tlsTimeMs,
            ipAddress: checkResult.ipAddress,
            contentLength: checkResult.contentLength,
            isSuccessful: checkResult.isSuccessful,
            errorMessage: checkResult.errorMessage,
            sslValid: checkResult.sslInfo?.valid ?? null,
          },
        });

        await prisma.website.update({
          where: { id: newWebsite.id },
          data: {
            status: checkResult.status,
            statusReason: checkResult.isSuccessful
              ? `HTTP ${checkResult.httpStatus} OK (${checkResult.responseTimeMs}ms)`
              : (checkResult.errorMessage || "Không thể kết nối"),
            lastCheckedAt: checkResult.checkedAt,
            lastResponseTime: checkResult.responseTimeMs,
            lastHttpStatus: checkResult.httpStatus,
            sslValid: checkResult.sslInfo?.valid ?? null,
            sslIssuer: checkResult.sslInfo?.issuer,
            sslExpirationDate: checkResult.sslInfo?.expiresAt,
            sslDaysRemaining: checkResult.sslInfo?.daysRemaining,
          },
        });
      } catch {
        // Ignored; worker will follow up
      }
    }

    return NextResponse.json({
      success: true,
      message: "Thêm website thành công",
      data: newWebsite,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
    return NextResponse.json(
      { success: false, message: errMsg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
