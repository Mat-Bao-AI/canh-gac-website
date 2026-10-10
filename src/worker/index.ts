import { config } from "dotenv";
config();

import { prisma } from "../lib/db";
import { executeWebsiteCheck } from "../lib/checker";
import { logger } from "../lib/logger";
import { broadcastRealtimeEvent } from "../lib/events";
import {
  sendTelegramMessage,
  formatDownAlertTelegram,
  formatRecoveryAlertTelegram,
  formatSSLAlertTelegram,
} from "../lib/telegram";

const CONCURRENCY_LIMIT = parseInt(process.env.MONITOR_WORKER_CONCURRENCY || "5", 10);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

let isRunning = true;
let activeChecksCount = 0;
const workerStartTime = Date.now();

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} giây`;
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  if (minutes < 60) return `${minutes} phút ${remainingSecs > 0 ? remainingSecs + " giây" : ""}`.trim();
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours} giờ ${remainingMins} phút`;
}

// 1. Worker Heartbeat recorder (Requirement 14)
async function recordHeartbeat(queueDepth: number = 0) {
  try {
    const uptime = Math.round((Date.now() - workerStartTime) / 1000);
    const hb = await prisma.workerHeartbeat.upsert({
      where: { id: "primary-worker" },
      update: {
        workerStatus: "HEALTHY",
        lastHeartbeatAt: new Date(),
        activeJobs: activeChecksCount,
        queueDepth,
        uptimeSeconds: uptime,
      },
      create: {
        id: "primary-worker",
        workerStatus: "HEALTHY",
        lastHeartbeatAt: new Date(),
        activeJobs: activeChecksCount,
        queueDepth,
        uptimeSeconds: uptime,
      },
    });

    broadcastRealtimeEvent("worker.heartbeat", {
      status: hb.workerStatus,
      lastHeartbeatAt: hb.lastHeartbeatAt.toISOString(),
      activeJobs: activeChecksCount,
      queueDepth,
      uptimeSeconds: uptime,
    });
  } catch (err: unknown) {
    logger.error("Error writing worker heartbeat", { error: String(err) });
  }
}

async function processWebsiteCheck(websiteId: string) {
  try {
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
      include: {
        user: {
          include: {
            settings: true,
          },
        },
        incidents: {
          where: { status: "OPEN" },
          orderBy: { startedAt: "desc" },
          take: 1,
        },
        securityScans: {
          orderBy: { scannedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!website || website.currentState === "PAUSED") {
      return;
    }

    const baselineScan = website.securityScans[0];
    const userSettings = website.user.settings;
    const retryThreshold = userSettings?.retryThreshold ?? 2;

    logger.info(`Starting check for website: ${website.name} (${website.url})`);

    const result = await executeWebsiteCheck({
      url: website.url,
      expectedStatusCode: website.expectedStatusCode,
      expectedKeyword: website.expectedKeyword,
      responseThresholdMs: website.responseThresholdMs,
      checkSSL: true,
      checkAnomaly: true,
      baseline: baselineScan
        ? {
            htmlHash: baselineScan.htmlHash,
            pageTitle: baselineScan.pageTitle,
            metaDescription: baselineScan.metaDescription,
          }
        : undefined,
    });

    // 1. Record detailed check log with timing measurements
    await prisma.checkLog.create({
      data: {
        websiteId: website.id,
        checkedAt: result.checkedAt,
        httpStatus: result.httpStatus,
        responseTimeMs: result.responseTimeMs,
        dnsTimeMs: result.dnsTimeMs,
        connectTimeMs: result.connectTimeMs,
        tlsTimeMs: result.tlsTimeMs,
        ipAddress: result.ipAddress,
        contentLength: result.contentLength,
        isSuccessful: result.isSuccessful,
        errorMessage: result.errorMessage,
        sslValid: result.sslInfo?.valid ?? null,
      },
    });

    // 2. State & Incident Machine
    const openIncident = website.incidents[0];
    let nextStatus: string = result.status;
    let nextFailures = website.consecutiveFailures;
    const now = result.checkedAt;

    if (result.status === "DOWN") {
      nextFailures += 1;
      logger.warn(`Website check failed (${nextFailures}/${retryThreshold}): ${website.name}`, {
        error: result.errorMessage,
      });

      if (nextFailures >= retryThreshold) {
        nextStatus = "DOWN";

        // Create incident if not already open
        if (!openIncident) {
          const newIncident = await prisma.incident.create({
            data: {
              websiteId: website.id,
              startedAt: now,
              cause: result.errorMessage || `HTTP ${result.httpStatus || 500} Error`,
              status: "OPEN",
            },
          });

          logger.info(`Incident created #${newIncident.id} for website ${website.name}`);

          broadcastRealtimeEvent("incident.created", {
            incidentId: newIncident.id,
            websiteId: website.id,
            websiteName: website.name,
            cause: newIncident.cause,
            startedAt: newIncident.startedAt.toISOString(),
          });

          // Send Telegram Alert if configured
          const botToken = userSettings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
          const chatId = userSettings?.telegramChatId || process.env.TELEGRAM_CHAT_ID;
          const isTelegramEnabled = userSettings ? userSettings.telegramEnabled && userSettings.alertDown : true;

          if (botToken && chatId && isTelegramEnabled) {
            const timeString = now.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });

            const msg = formatDownAlertTelegram({
              websiteName: website.name,
              url: website.url,
              httpStatus: result.httpStatus,
              errorMessage: result.errorMessage,
              timeString,
              incidentId: newIncident.id,
              appUrl: APP_URL,
            });

            const sendRes = await sendTelegramMessage({
              botToken,
              chatId,
              message: msg,
            });

            await prisma.notificationHistory.create({
              data: {
                websiteId: website.id,
                incidentId: newIncident.id,
                eventType: "DOWN",
                channel: "TELEGRAM",
                messageBody: msg,
                status: sendRes.success ? "SENT" : "FAILED",
                errorMessage: sendRes.error,
              },
            });
          }
        }
      } else {
        // Still retrying: marked as DEGRADED or keep current DOWN
        nextStatus = website.status === "DOWN" ? "DOWN" : "DEGRADED";
      }
    } else {
      // Result is UP or DEGRADED
      nextFailures = 0;

      // RECOVERY DETECTION
      if (openIncident) {
        const resolvedAt = now;
        const durationSeconds = Math.round((resolvedAt.getTime() - openIncident.startedAt.getTime()) / 1000);

        await prisma.incident.update({
          where: { id: openIncident.id },
          data: {
            status: "RESOLVED",
            resolvedAt,
            durationSeconds,
          },
        });

        logger.info(`Incident resolved #${openIncident.id} for website ${website.name}. Downtime: ${durationSeconds}s`);

        broadcastRealtimeEvent("incident.resolved", {
          incidentId: openIncident.id,
          websiteId: website.id,
          websiteName: website.name,
          resolvedAt: resolvedAt.toISOString(),
          durationSeconds,
        });

        // Send Recovery Telegram Alert
        const botToken = userSettings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
        const chatId = userSettings?.telegramChatId || process.env.TELEGRAM_CHAT_ID;
        const isTelegramEnabled = userSettings ? userSettings.telegramEnabled && userSettings.alertRecovery : true;

        if (botToken && chatId && isTelegramEnabled) {
          const timeString = resolvedAt.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });

          const msg = formatRecoveryAlertTelegram({
            websiteName: website.name,
            url: website.url,
            downtimeText: formatDuration(durationSeconds),
            timeString,
            responseTime: result.responseTimeMs,
            appUrl: APP_URL,
          });

          const sendRes = await sendTelegramMessage({
            botToken,
            chatId,
            message: msg,
          });

          await prisma.notificationHistory.create({
            data: {
              websiteId: website.id,
              incidentId: openIncident.id,
              eventType: "RECOVERY",
              channel: "TELEGRAM",
              messageBody: msg,
              status: sendRes.success ? "SENT" : "FAILED",
              errorMessage: sendRes.error,
            },
          });
        }
      }
    }

    // 3. SSL Expiration alert check
    if (result.sslInfo && result.sslInfo.daysRemaining !== null) {
      const days = result.sslInfo.daysRemaining;
      const warningDays = userSettings?.sslWarningDays ?? 15;

      if (days <= warningDays && days > 0) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const recentSslAlert = await prisma.notificationHistory.findFirst({
          where: {
            websiteId: website.id,
            eventType: "SSL_WARNING",
            sentAt: { gte: todayStart },
          },
        });

        if (!recentSslAlert) {
          const botToken = userSettings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
          const chatId = userSettings?.telegramChatId || process.env.TELEGRAM_CHAT_ID;
          if (botToken && chatId && (userSettings?.telegramEnabled ?? true)) {
            const expiresAtStr = result.sslInfo.expiresAt?.toLocaleDateString("vi-VN") || "N/A";
            const msg = formatSSLAlertTelegram({
              websiteName: website.name,
              url: website.url,
              daysRemaining: days,
              expiresAt: expiresAtStr,
              appUrl: APP_URL,
            });

            const sendRes = await sendTelegramMessage({
              botToken,
              chatId,
              message: msg,
            });

            await prisma.notificationHistory.create({
              data: {
                websiteId: website.id,
                eventType: "SSL_WARNING",
                channel: "TELEGRAM",
                messageBody: msg,
                status: sendRes.success ? "SENT" : "FAILED",
                errorMessage: sendRes.error,
              },
            });
          }
        }
      }
    }

    // 4. Save Security Scan if performed
    if (result.anomalyResult) {
      await prisma.securityScan.create({
        data: {
          websiteId: website.id,
          scannedAt: now,
          htmlHash: result.anomalyResult.htmlHash,
          pageTitle: result.anomalyResult.pageTitle,
          metaDescription: result.anomalyResult.metaDescription,
          hasAnomaly: result.anomalyResult.hasAnomaly,
          titleChanged: result.anomalyResult.titleChanged,
          metaChanged: result.anomalyResult.metaChanged,
          suspiciousTagsFound: JSON.stringify(result.anomalyResult.suspiciousKeywordsFound),
          suspiciousLinks: JSON.stringify(result.anomalyResult.externalLinks.slice(0, 20)),
          details: result.anomalyResult.details,
        },
      });
    }

    // 5. Update website fields
    const nextCheckDate = new Date(now.getTime() + website.checkInterval * 1000);

    const updatedWebsite = await prisma.website.update({
      where: { id: website.id },
      data: {
        status: nextStatus,
        statusReason: result.statusReason,
        statusUpdatedAt: now,
        lastCheckedAt: now,
        lastSuccessAt: result.isSuccessful ? now : website.lastSuccessAt,
        lastFailureAt: !result.isSuccessful ? now : website.lastFailureAt,
        lastResponseTime: result.responseTimeMs,
        lastHttpStatus: result.httpStatus,
        nextCheckAt: nextCheckDate,
        consecutiveFailures: nextFailures,
        sslValid: result.sslInfo ? result.sslInfo.valid : website.sslValid,
        sslIssuer: result.sslInfo ? result.sslInfo.issuer : website.sslIssuer,
        sslExpirationDate: result.sslInfo?.expiresAt ? result.sslInfo.expiresAt : website.sslExpirationDate,
        sslDaysRemaining: result.sslInfo?.daysRemaining !== undefined ? result.sslInfo.daysRemaining : website.sslDaysRemaining,
      },
    });

    // 6. Broadcast Real-time event to SSE listeners
    broadcastRealtimeEvent("website.check.completed", {
      websiteId: website.id,
      name: website.name,
      status: nextStatus,
      statusReason: result.statusReason,
      responseTimeMs: result.responseTimeMs,
      httpStatus: result.httpStatus,
      checkedAt: now.toISOString(),
      nextCheckAt: nextCheckDate.toISOString(),
    });

    if (website.status !== nextStatus) {
      broadcastRealtimeEvent("website.status.changed", {
        websiteId: website.id,
        name: website.name,
        oldStatus: website.status,
        newStatus: nextStatus,
        reason: result.statusReason,
      });
    }

    logger.info(`Check completed for ${website.name}: ${nextStatus} (${result.responseTimeMs}ms)`);
  } catch (error: unknown) {
    logger.error(`Error processing check for website ${websiteId}`, { error: String(error) });
  }
}

async function runWorkerCycle() {
  if (!isRunning) return;

  try {
    const now = new Date();

    // Query active websites needing a check
    const websites = await prisma.website.findMany({
      where: {
        currentState: "ACTIVE",
      },
      select: {
        id: true,
        checkInterval: true,
        lastCheckedAt: true,
      },
    });

    const websitesDue = websites.filter((w) => {
      if (!w.lastCheckedAt) return true;
      const elapsedSeconds = (now.getTime() - new Date(w.lastCheckedAt).getTime()) / 1000;
      return elapsedSeconds >= w.checkInterval;
    });

    // Record heartbeat with current queue depth
    await recordHeartbeat(websitesDue.length);

    if (websitesDue.length > 0) {
      logger.info(`Found ${websitesDue.length} websites due for monitoring check`);
    }

    // Process in batches respecting concurrency limit
    for (let i = 0; i < websitesDue.length; i += CONCURRENCY_LIMIT) {
      if (!isRunning) break;
      const batch = websitesDue.slice(i, i + CONCURRENCY_LIMIT);
      activeChecksCount += batch.length;
      await Promise.all(batch.map((w) => processWebsiteCheck(w.id)));
      activeChecksCount -= batch.length;
    }
  } catch (err: unknown) {
    logger.error("Worker cycle error", { error: String(err) });
  }
}

async function startWorker() {
  logger.info("=========================================");
  logger.info("[VIBE HOST] CANH GAC WEBSITE MONITORING WORKER");
  logger.info(`Concurrency Limit: ${CONCURRENCY_LIMIT}`);
  logger.info("Worker started successfully and recording heartbeats...");
  logger.info("=========================================");

  // Immediate heartbeat and initial cycle
  await recordHeartbeat(0);
  await runWorkerCycle();

  // Run cycle every 5 seconds to pick up scheduled intervals
  const intervalId = setInterval(async () => {
    if (!isRunning) {
      clearInterval(intervalId);
      return;
    }
    await runWorkerCycle();
  }, 5000);
}

// Graceful termination
process.on("SIGINT", () => {
  logger.info("Monitoring worker shutting down (SIGINT)...");
  isRunning = false;
  setTimeout(() => process.exit(0), 1000);
});

process.on("SIGTERM", () => {
  logger.info("Monitoring worker shutting down (SIGTERM)...");
  isRunning = false;
  setTimeout(() => process.exit(0), 1000);
});

// Run directly
if (require.main === module) {
  startWorker().catch((err) => {
    logger.error("Fatal error starting worker", { error: String(err) });
    process.exit(1);
  });
}

export { processWebsiteCheck, startWorker };
