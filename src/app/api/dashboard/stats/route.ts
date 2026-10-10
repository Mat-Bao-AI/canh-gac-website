import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { evaluateWebsiteState } from "@/lib/staleness";

export async function GET(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Chưa đăng nhập", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 1. Fetch Worker Heartbeat
    const workerHeartbeat = await prisma.workerHeartbeat.findUnique({
      where: { id: "primary-worker" },
    });

    const isWorkerActive = workerHeartbeat
      ? Date.now() - new Date(workerHeartbeat.lastHeartbeatAt).getTime() < 45000
      : false;

    // 2. Fetch user's websites
    const websites = await prisma.website.findMany({
      where: { userId: user.id },
      orderBy: { lastCheckedAt: "desc" },
    });

    // 3. Evaluate actual state for each website
    const evaluatedSites = websites.map((w) => {
      const state = evaluateWebsiteState(w, workerHeartbeat);
      return {
        ...w,
        evaluatedState: state,
      };
    });

    const totalWebsites = evaluatedSites.length;
    const upWebsites = evaluatedSites.filter((w) => w.evaluatedState.displayStatus === "UP").length;
    const degradedWebsites = evaluatedSites.filter((w) => w.evaluatedState.displayStatus === "DEGRADED").length;
    const downWebsites = evaluatedSites.filter((w) => w.evaluatedState.displayStatus === "DOWN").length;
    const unknownWebsites = evaluatedSites.filter((w) => w.evaluatedState.displayStatus === "UNKNOWN").length;
    const pausedWebsites = evaluatedSites.filter((w) => w.evaluatedState.displayStatus === "PAUSED").length;

    // 4. Calculate actual uptime from check logs
    const totalLogs = await prisma.checkLog.count({
      where: { website: { userId: user.id } },
    });

    const successfulLogs = await prisma.checkLog.count({
      where: {
        website: { userId: user.id },
        isSuccessful: true,
      },
    });

    const avgUptime = totalLogs > 0 ? Number(((successfulLogs / totalLogs) * 100).toFixed(2)) : null;

    // 5. Fetch Recent Websites (top 5) with evaluated states
    const recentWebsites = evaluatedSites.slice(0, 5).map((w) => ({
      id: w.id,
      name: w.name,
      url: w.url,
      status: w.evaluatedState.displayStatus,
      rawStatus: w.status,
      statusReason: w.evaluatedState.evidence,
      isStale: w.evaluatedState.isStale,
      lastResponseTime: w.lastResponseTime,
      lastHttpStatus: w.lastHttpStatus,
      sslDaysRemaining: w.sslDaysRemaining,
      sslValid: w.sslValid,
      lastCheckedAt: w.lastCheckedAt,
      nextCheckAt: w.nextCheckAt,
      checkInterval: w.checkInterval,
    }));

    // 6. Fetch Recent Alerts / Notifications (top 5)
    const recentNotifications = await prisma.notificationHistory.findMany({
      where: {
        website: { userId: user.id },
      },
      include: {
        website: {
          select: { name: true, url: true },
        },
      },
      orderBy: { sentAt: "desc" },
      take: 5,
    });

    // 7. Aggregate 7-day timeline strictly from check logs
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const pastLogs = await prisma.checkLog.findMany({
      where: {
        website: { userId: user.id },
        checkedAt: { gte: sevenDaysAgo },
      },
      select: {
        checkedAt: true,
        isSuccessful: true,
        responseTimeMs: true,
      },
    });

    // Build day-by-day counts
    const timelineData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const dateStr = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

      const dayLogs = pastLogs.filter(
        (log) => new Date(log.checkedAt) >= startOfDay && new Date(log.checkedAt) <= endOfDay
      );

      const successfulCount = dayLogs.filter((l) => l.isSuccessful && l.responseTimeMs <= 1000).length;
      const degradedCount = dayLogs.filter((l) => l.isSuccessful && l.responseTimeMs > 1000).length;
      const failedCount = dayLogs.filter((l) => !l.isSuccessful).length;

      timelineData.push({
        date: dateStr,
        online: successfulCount,
        warning: degradedCount,
        down: failedCount,
        totalChecks: dayLogs.length,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        worker: {
          isActive: isWorkerActive,
          lastHeartbeatAt: workerHeartbeat?.lastHeartbeatAt || null,
          activeJobs: workerHeartbeat?.activeJobs || 0,
          queueDepth: workerHeartbeat?.queueDepth || 0,
          workerStatus: workerHeartbeat?.workerStatus || "STOPPED",
        },
        counts: {
          total: totalWebsites,
          up: upWebsites,
          degraded: degradedWebsites,
          down: downWebsites,
          unknown: unknownWebsites,
          paused: pausedWebsites,
          avgUptime,
          totalChecks: totalLogs,
        },
        recentWebsites,
        recentNotifications,
        timelineData,
        lastUpdated: now.toISOString(),
      },
    });
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
