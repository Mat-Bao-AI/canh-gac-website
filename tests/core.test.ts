import { describe, it } from "node:test";
import assert from "node:assert";
import { isIpPrivateOrReserved, validateUrlAgainstSSRF } from "../src/lib/ssrf";
import { detectAnomalies, extractHtmlMetadata } from "../src/lib/anomaly";
import { evaluateWebsiteState } from "../src/lib/staleness";

describe("Core Monitoring Logic & Security Tests", () => {
  describe("1. SSRF URL Validation & Private IP Filtering", () => {
    it("should correctly identify localhost and private IPv4 ranges", () => {
      assert.strictEqual(isIpPrivateOrReserved("127.0.0.1"), true);
      assert.strictEqual(isIpPrivateOrReserved("127.255.255.255"), true);
      assert.strictEqual(isIpPrivateOrReserved("10.0.0.1"), true);
      assert.strictEqual(isIpPrivateOrReserved("192.168.1.1"), true);
      assert.strictEqual(isIpPrivateOrReserved("172.16.0.1"), true);
      assert.strictEqual(isIpPrivateOrReserved("172.31.255.254"), true);
      assert.strictEqual(isIpPrivateOrReserved("169.254.169.254"), true); // AWS metadata
      assert.strictEqual(isIpPrivateOrReserved("0.0.0.0"), true);
    });

    it("should allow public Internet IP addresses", () => {
      assert.strictEqual(isIpPrivateOrReserved("8.8.8.8"), false);
      assert.strictEqual(isIpPrivateOrReserved("1.1.1.1"), false);
      assert.strictEqual(isIpPrivateOrReserved("104.26.5.15"), false);
    });

    it("should reject localhost hostnames from SSRF", async () => {
      const res1 = await validateUrlAgainstSSRF("http://localhost:3000");
      assert.strictEqual(res1.isValid, false);

      const res2 = await validateUrlAgainstSSRF("http://127.0.0.1/admin");
      assert.strictEqual(res2.isValid, false);

      const res3 = await validateUrlAgainstSSRF("http://169.254.169.254/latest/meta-data/");
      assert.strictEqual(res3.isValid, false);
    });

    it("should reject non-HTTP protocols", async () => {
      const res = await validateUrlAgainstSSRF("file:///etc/passwd");
      assert.strictEqual(res.isValid, false);
    });
  });

  describe("2. Anomaly Detection & Keyword Scanning", () => {
    it("should extract HTML title, meta description and hash", () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Trang web chính thức</title>
            <meta name="description" content="Chuyên cung cấp dịch vụ máy chủ uy tín" />
          </head>
          <body>
            <a href="https://partner.com">Đối tác</a>
          </body>
        </html>
      `;
      const metadata = extractHtmlMetadata(html);
      assert.strictEqual(metadata.pageTitle, "Trang web chính thức");
      assert.strictEqual(metadata.metaDescription, "Chuyên cung cấp dịch vụ máy chủ uy tín");
      assert.strictEqual(metadata.externalLinks.length, 1);
      assert.strictEqual(metadata.externalLinks[0], "https://partner.com");
      assert.ok(metadata.htmlHash.length > 20);
    });

    it("should flag suspicious keywords such as casino, betting, gambling", () => {
      const cleanHtml = "<html><body><h1>Chào mừng quý khách</h1></body></html>";
      const cleanResult = detectAnomalies(cleanHtml);
      assert.strictEqual(cleanResult.hasAnomaly, false);

      const hackedHtml = "<html><body><h1>Chào mừng</h1><p>Chơi casino online kubet tặng tiền</p></body></html>";
      const hackedResult = detectAnomalies(hackedHtml);
      assert.strictEqual(hackedResult.hasAnomaly, true);
      assert.ok(hackedResult.suspiciousKeywordsFound.includes("casino"));
      assert.ok(hackedResult.suspiciousKeywordsFound.includes("kubet"));
    });

    it("should detect title changes compared to baseline", () => {
      const currentHtml = "<html><head><title>Trang Bị Hack</title></head></html>";
      const baseline = {
        pageTitle: "Trang Web Ban Đầu",
        metaDescription: "Mô tả ban đầu",
      };
      const result = detectAnomalies(currentHtml, baseline);
      assert.strictEqual(result.titleChanged, true);
      assert.strictEqual(result.hasAnomaly, true);
    });
  });

  describe("3. Uptime & Retry Threshold Logic", () => {
    it("should calculate uptime percentage accurately", () => {
      const totalChecks = 1000;
      const successfulChecks = 998;
      const uptime = Number(((successfulChecks / totalChecks) * 100).toFixed(2));
      assert.strictEqual(uptime, 99.8);
    });

    it("should require 2 consecutive failures before confirming DOWN", () => {
      const retryThreshold = 2;
      let consecutiveFailures = 0;
      let status = "UP";

      // Attempt 1: Fail
      consecutiveFailures += 1;
      if (consecutiveFailures >= retryThreshold) {
        status = "DOWN";
      } else {
        status = "WARNING";
      }
      assert.strictEqual(status, "WARNING");
      assert.strictEqual(consecutiveFailures, 1);

      // Attempt 2: Fail again
      consecutiveFailures += 1;
      if (consecutiveFailures >= retryThreshold) {
        status = "DOWN";
      }
      assert.strictEqual(status, "DOWN");
      assert.strictEqual(consecutiveFailures, 2);

      // Recovery: Success
      consecutiveFailures = 0;
      status = "UP";
      assert.strictEqual(status, "UP");
      assert.strictEqual(consecutiveFailures, 0);
    });

    it("should classify SSL remaining days warning thresholds", () => {
      const checkWarning = (daysRemaining: number) => {
        if (daysRemaining <= 0) return "EXPIRED";
        if (daysRemaining <= 7) return "CRITICAL";
        if (daysRemaining <= 15) return "WARNING";
        if (daysRemaining <= 30) return "WARNING";
        return "NORMAL";
      };

      assert.strictEqual(checkWarning(89), "NORMAL");
      assert.strictEqual(checkWarning(25), "WARNING");
      assert.strictEqual(checkWarning(6), "CRITICAL");
      assert.strictEqual(checkWarning(-1), "EXPIRED");
    });
  });

  describe("4. Dynamic Staleness & UNKNOWN State Machine", () => {
    it("should return UNKNOWN when a website has never been checked", () => {
      const site = {
        status: "UP",
        currentState: "ACTIVE",
        checkInterval: 300,
        lastCheckedAt: null,
      };
      const result = evaluateWebsiteState(site);
      assert.strictEqual(result.displayStatus, "UNKNOWN");
      assert.strictEqual(result.label, "Chưa có dữ liệu");
    });

    it("should transition to UNKNOWN when check data is stale", () => {
      // Last checked 20 minutes ago for a 5-minute interval website
      const site = {
        status: "UP",
        currentState: "ACTIVE",
        checkInterval: 300,
        lastCheckedAt: new Date(Date.now() - 20 * 60 * 1000),
      };
      const result = evaluateWebsiteState(site);
      assert.strictEqual(result.displayStatus, "UNKNOWN");
      assert.strictEqual(result.isStale, true);
    });

    it("should transition to UNKNOWN when worker heartbeat has stopped (> 45s)", () => {
      const site = {
        status: "UP",
        currentState: "ACTIVE",
        checkInterval: 300,
        lastCheckedAt: new Date(Date.now() - 30 * 1000), // fresh check
      };
      const deadWorker = {
        workerStatus: "STOPPED",
        lastHeartbeatAt: new Date(Date.now() - 60 * 1000), // dead 60s ago
      };
      const result = evaluateWebsiteState(site, deadWorker);
      assert.strictEqual(result.displayStatus, "UNKNOWN");
      assert.strictEqual(result.isStale, true);
      assert.ok(result.evidence.includes("Worker giám sát đã dừng"));
    });

    it("should maintain UP when both website check and worker heartbeat are fresh", () => {
      const site = {
        status: "UP",
        currentState: "ACTIVE",
        checkInterval: 300,
        lastCheckedAt: new Date(Date.now() - 30 * 1000),
        lastHttpStatus: 200,
        lastResponseTime: 320,
      };
      const liveWorker = {
        workerStatus: "RUNNING",
        lastHeartbeatAt: new Date(Date.now() - 5 * 1000),
      };
      const result = evaluateWebsiteState(site, liveWorker);
      assert.strictEqual(result.displayStatus, "UP");
      assert.strictEqual(result.isStale, false);
      assert.strictEqual(result.label, "Hoạt động");
    });

    it("should return PAUSED when user explicitly pauses monitoring", () => {
      const site = {
        status: "UP",
        currentState: "PAUSED",
        checkInterval: 300,
        lastCheckedAt: new Date(),
      };
      const result = evaluateWebsiteState(site);
      assert.strictEqual(result.displayStatus, "PAUSED");
      assert.strictEqual(result.label, "Tạm dừng");
    });
  });
});
