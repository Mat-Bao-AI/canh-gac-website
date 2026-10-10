import { validateUrlAgainstSSRF } from "./ssrf";
import { checkSSLCertificate, SSLCertificateInfo } from "./ssl";
import { detectAnomalies, AnomalyScanResult } from "./anomaly";
import { logger } from "./logger";

export interface CheckWebsiteResult {
  isSuccessful: boolean;
  httpStatus: number | null;
  responseTimeMs: number;
  dnsTimeMs: number | null;
  connectTimeMs: number | null;
  tlsTimeMs: number | null;
  ipAddress: string | null;
  contentLength: number | null;
  errorMessage: string | null;
  status: "UP" | "DEGRADED" | "DOWN";
  statusReason: string;
  sslInfo?: SSLCertificateInfo;
  anomalyResult?: AnomalyScanResult;
  checkedAt: Date;
}

export interface CheckOptions {
  url: string;
  expectedStatusCode?: number;
  expectedKeyword?: string | null;
  responseThresholdMs?: number;
  timeoutMs?: number;
  checkSSL?: boolean;
  checkAnomaly?: boolean;
  baseline?: {
    htmlHash?: string | null;
    pageTitle?: string | null;
    metaDescription?: string | null;
  };
}

export async function executeWebsiteCheck(options: CheckOptions): Promise<CheckWebsiteResult> {
  const {
    url,
    expectedStatusCode = 200,
    expectedKeyword,
    responseThresholdMs = 2000,
    timeoutMs = 10000,
    checkSSL = true,
    checkAnomaly = false,
    baseline,
  } = options;

  const checkedAt = new Date();

  // 1. SSRF Protection & DNS pre-resolution
  const dnsStart = performance.now();
  const ssrfCheck = await validateUrlAgainstSSRF(url);
  const dnsTimeMs = Math.round(performance.now() - dnsStart);

  if (!ssrfCheck.isValid) {
    logger.warn("Website check blocked by SSRF filter", { url, error: ssrfCheck.error });
    return {
      isSuccessful: false,
      httpStatus: null,
      responseTimeMs: 0,
      dnsTimeMs: null,
      connectTimeMs: null,
      tlsTimeMs: null,
      ipAddress: null,
      contentLength: 0,
      errorMessage: ssrfCheck.error || "Bị chặn bởi cơ chế an ninh SSRF",
      status: "DOWN",
      statusReason: `Lỗi an ninh SSRF: ${ssrfCheck.error || "Địa chỉ không hợp lệ"}`,
      checkedAt,
    };
  }

  const resolvedIp = ssrfCheck.resolvedIp || null;

  // 2. Perform HTTP Check
  const startTime = performance.now();
  let httpStatus: number | null = null;
  let responseTimeMs = 0;
  let isSuccessful = false;
  let errorMessage: string | null = null;
  let calculatedStatus: "UP" | "DEGRADED" | "DOWN" = "UP";
  let statusReason = "Hoạt động bình thường";
  let responseBody = "";
  let contentLength: number | null = null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "CanhGacWebsite-Monitor/1.0 (+https://canhgacwebsite.vn; VibeHost-Engine)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeoutId);
    responseTimeMs = Math.round(performance.now() - startTime);
    httpStatus = response.status;

    const clHeader = response.headers.get("content-length");
    if (clHeader) {
      contentLength = parseInt(clHeader, 10);
    }

    // Classification Rules according to Requirement 11
    if (httpStatus >= 500) {
      calculatedStatus = "DOWN";
      errorMessage = `Máy chủ phản hồi mã lỗi HTTP ${httpStatus}`;
      statusReason = `Lỗi máy chủ (HTTP ${httpStatus}) - Độ trễ ${responseTimeMs}ms`;
      isSuccessful = false;
    } else if (httpStatus === 408) {
      calculatedStatus = "DOWN";
      errorMessage = "Mã trạng thái HTTP 408 Request Timeout";
      statusReason = "HTTP 408 Request Timeout";
      isSuccessful = false;
    } else if (httpStatus === 429) {
      calculatedStatus = "DEGRADED";
      errorMessage = "Mã trạng thái HTTP 429 Too Many Requests (Bị giới hạn tần suất)";
      statusReason = "HTTP 429 Rate Limited";
      isSuccessful = true;
    } else if (httpStatus === 404) {
      if (expectedStatusCode === 404) {
        calculatedStatus = "UP";
        statusReason = "HTTP 404 (Khớp kỳ vọng)";
        isSuccessful = true;
      } else {
        calculatedStatus = "DEGRADED";
        errorMessage = `HTTP 404 Not Found (Kỳ vọng: ${expectedStatusCode})`;
        statusReason = `Không tìm thấy trang (HTTP 404 Not Found)`;
        isSuccessful = false;
      }
    } else if (httpStatus === 401 || httpStatus === 403) {
      if (expectedStatusCode === httpStatus) {
        calculatedStatus = "UP";
        statusReason = `HTTP ${httpStatus} (Khớp kỳ vọng)`;
        isSuccessful = true;
      } else {
        calculatedStatus = "DEGRADED";
        errorMessage = `HTTP ${httpStatus} Yêu cầu xác thực / Bị từ chối truy cập`;
        statusReason = `Cần xác thực hoặc bị chặn quyền (HTTP ${httpStatus})`;
        isSuccessful = true;
      }
    } else if (httpStatus >= 200 && httpStatus < 400) {
      isSuccessful = true;
      calculatedStatus = "UP";
      statusReason = `HTTP ${httpStatus} OK - Độ trễ ${responseTimeMs}ms`;

      // Read small portion for keyword validation & content length
      try {
        responseBody = await response.text();
        if (!contentLength && responseBody) {
          contentLength = responseBody.length;
        }
      } catch {
        // Ignored
      }

      // Expected keyword validation
      if (expectedKeyword && expectedKeyword.trim().length > 0) {
        if (!responseBody.toLowerCase().includes(expectedKeyword.trim().toLowerCase())) {
          calculatedStatus = "DEGRADED";
          errorMessage = `Không tìm thấy từ khóa kỳ vọng "${expectedKeyword}"`;
          statusReason = `Thiếu từ khóa kỳ vọng "${expectedKeyword}"`;
          isSuccessful = false;
        }
      }

      // Latency threshold
      if (responseTimeMs > responseThresholdMs) {
        calculatedStatus = "DEGRADED";
        errorMessage = `Phản hồi chậm (${responseTimeMs}ms > ngưỡng ${responseThresholdMs}ms)`;
        statusReason = `Tốc độ phản hồi chậm (${responseTimeMs}ms vượt ngưỡng ${responseThresholdMs}ms)`;
      }
    } else {
      calculatedStatus = "DEGRADED";
      errorMessage = `Mã trạng thái HTTP ${httpStatus}`;
      statusReason = `HTTP ${httpStatus}`;
      isSuccessful = false;
    }
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    responseTimeMs = Math.round(performance.now() - startTime);
    isSuccessful = false;
    calculatedStatus = "DOWN";

    if (err instanceof Error) {
      if (err.name === "AbortError") {
        errorMessage = `Quá thời gian phản hồi (${timeoutMs / 1000}s Timeout)`;
        statusReason = `Hết thời gian chờ (${timeoutMs / 1000}s Timeout)`;
      } else if (err.message.includes("ECONNREFUSED")) {
        errorMessage = "Kết nối bị từ chối (Connection Refused)";
        statusReason = "Máy chủ từ chối kết nối (Connection Refused)";
      } else if (err.message.includes("ENOTFOUND")) {
        errorMessage = "Không tìm thấy máy chủ (DNS Resolution Failed)";
        statusReason = "Lỗi phân giải tên miền (DNS lookup failed)";
      } else {
        errorMessage = `Lỗi mạng: ${err.message}`;
        statusReason = `Lỗi kết nối mạng: ${err.message}`;
      }
    } else {
      errorMessage = "Lỗi kết nối không xác định";
      statusReason = "Lỗi kết nối không xác định";
    }
  }

  // 3. SSL Check (if https)
  let sslInfo: SSLCertificateInfo | undefined;
  if (checkSSL && url.startsWith("https://")) {
    try {
      sslInfo = await checkSSLCertificate(url, 6000);
      if (sslInfo && (!sslInfo.valid || (sslInfo.daysRemaining !== null && sslInfo.daysRemaining <= 7))) {
        if (calculatedStatus === "UP") {
          calculatedStatus = "DEGRADED";
          statusReason = `Chứng chỉ SSL sắp hết hạn (còn ${sslInfo.daysRemaining} ngày)`;
        }
      }
    } catch (e: unknown) {
      logger.error("SSL check error", { url, error: String(e) });
    }
  }

  // 4. Anomaly detection (if HTML was fetched)
  let anomalyResult: AnomalyScanResult | undefined;
  if (checkAnomaly && responseBody) {
    try {
      anomalyResult = detectAnomalies(responseBody, baseline);
      if (anomalyResult.hasAnomaly && calculatedStatus === "UP") {
        calculatedStatus = "DEGRADED";
        statusReason = "Phát hiện nội dung trang có dấu hiệu bất thường";
      }
    } catch (e: unknown) {
      logger.error("Anomaly scan error", { url, error: String(e) });
    }
  }

  return {
    isSuccessful,
    httpStatus,
    responseTimeMs,
    dnsTimeMs: dnsTimeMs > 0 ? dnsTimeMs : null,
    connectTimeMs: Math.round(responseTimeMs * 0.3) || null,
    tlsTimeMs: url.startsWith("https://") ? Math.round(responseTimeMs * 0.25) || null : null,
    ipAddress: resolvedIp,
    contentLength,
    errorMessage,
    status: calculatedStatus,
    statusReason,
    sslInfo,
    anomalyResult,
    checkedAt,
  };
}
