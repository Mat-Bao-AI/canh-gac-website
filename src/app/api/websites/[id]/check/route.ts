import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { executeWebsiteCheck } from "@/lib/checker";
import { broadcastRealtimeEvent } from "@/lib/events";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
        securityScans: {
          orderBy: { scannedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!website || website.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy website", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const baseline = website.securityScans[0];

    // Execute real live check with full timing breakdown
    const checkResult = await executeWebsiteCheck({
      url: website.url,
      expectedStatusCode: website.expectedStatusCode,
      expectedKeyword: website.expectedKeyword,
      responseThresholdMs: website.responseThresholdMs,
      checkSSL: true,
      checkAnomaly: true,
      baseline: baseline
        ? {
            htmlHash: baseline.htmlHash,
            pageTitle: baseline.pageTitle,
            metaDescription: baseline.metaDescription,
          }
        : undefined,
    });

    // Record check log with real metrics
    const log = await prisma.checkLog.create({
      data: {
        websiteId: website.id,
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

    if (checkResult.anomalyResult) {
      await prisma.securityScan.create({
        data: {
          websiteId: website.id,
          scannedAt: checkResult.checkedAt,
          htmlHash: checkResult.anomalyResult.htmlHash,
          pageTitle: checkResult.anomalyResult.pageTitle,
          metaDescription: checkResult.anomalyResult.metaDescription,
          hasAnomaly: checkResult.anomalyResult.hasAnomaly,
          titleChanged: checkResult.anomalyResult.titleChanged,
          metaChanged: checkResult.anomalyResult.metaChanged,
          suspiciousTagsFound: JSON.stringify(checkResult.anomalyResult.suspiciousKeywordsFound),
          suspiciousLinks: JSON.stringify(checkResult.anomalyResult.externalLinks.slice(0, 20)),
          details: checkResult.anomalyResult.details,
        },
      });
    }

    const nextCheckDate = new Date(checkResult.checkedAt.getTime() + website.checkInterval * 1000);

    // Update website fields
    const updated = await prisma.website.update({
      where: { id: website.id },
      data: {
        status: checkResult.status,
        statusReason: checkResult.statusReason,
        statusUpdatedAt: checkResult.checkedAt,
        lastCheckedAt: checkResult.checkedAt,
        lastSuccessAt: checkResult.isSuccessful ? checkResult.checkedAt : website.lastSuccessAt,
        lastFailureAt: !checkResult.isSuccessful ? checkResult.checkedAt : website.lastFailureAt,
        lastResponseTime: checkResult.responseTimeMs,
        lastHttpStatus: checkResult.httpStatus,
        nextCheckAt: nextCheckDate,
        sslValid: checkResult.sslInfo?.valid ?? website.sslValid,
        sslIssuer: checkResult.sslInfo?.issuer ?? website.sslIssuer,
        sslExpirationDate: checkResult.sslInfo?.expiresAt ?? website.sslExpirationDate,
        sslDaysRemaining: checkResult.sslInfo?.daysRemaining ?? website.sslDaysRemaining,
      },
    });

    // Broadcast realtime event
    broadcastRealtimeEvent("website.check.completed", {
      websiteId: website.id,
      name: website.name,
      status: checkResult.status,
      statusReason: checkResult.statusReason,
      responseTimeMs: checkResult.responseTimeMs,
      httpStatus: checkResult.httpStatus,
      checkedAt: checkResult.checkedAt.toISOString(),
      nextCheckAt: nextCheckDate.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Kiểm tra website hoàn tất",
      data: {
        website: updated,
        checkLog: log,
        result: checkResult,
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
