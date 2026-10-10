import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    // Query worker heartbeat
    const heartbeat = await prisma.workerHeartbeat.findUnique({
      where: { id: "primary-worker" },
    });

    let workerStatus = "stopped";
    let isWorkerHealthy = false;

    if (heartbeat) {
      const elapsedSecs = (Date.now() - new Date(heartbeat.lastHeartbeatAt).getTime()) / 1000;
      if (elapsedSecs <= 45) {
        workerStatus = "healthy";
        isWorkerHealthy = true;
      } else {
        workerStatus = "degraded (stale heartbeat)";
      }
    }

    const overallStatus = isWorkerHealthy ? "ok" : "degraded";

    return NextResponse.json({
      status: overallStatus,
      database: "connected",
      worker: workerStatus,
      queue: "healthy",
      workerDetails: heartbeat
        ? {
            lastHeartbeatAt: heartbeat.lastHeartbeatAt,
            activeJobs: heartbeat.activeJobs,
            queueDepth: heartbeat.queueDepth,
            uptimeSeconds: heartbeat.uptimeSeconds,
          }
        : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        worker: "stopped",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
