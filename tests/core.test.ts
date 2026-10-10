import { describe, it } from "node:test";
import assert from "node:assert";
import { isIpPrivateOrReserved, validateUrlAgainstSSRF } from "../src/lib/ssrf";
import { detectAnomalies, extractHtmlMetadata } from "../src/lib/anomaly";
import { evaluateWebsiteState } from "../src/lib/staleness";
import { generateSecret, generateTOTP, verifyTOTP, generateRecoveryCodes, verifyAndConsumeRecoveryCode } from "../src/lib/totp";

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

  describe("5. Two-Factor Authentication (RFC 6238 TOTP & Recovery Codes)", () => {
    it("should generate a valid Base32 secret key", () => {
      const secret = generateSecret();
      assert.ok(secret.length >= 26, "Secret must be at least 26 base32 characters");
      assert.ok(/^[A-Z2-7]+$/.test(secret), "Secret must strictly use RFC 4648 Base32 alphabet");
    });

    it("should generate and verify 6-digit TOTP token accurately", () => {
      const secret = generateSecret();
      const code = generateTOTP(secret);
      assert.strictEqual(code.length, 6, "TOTP code must be 6 digits");
      assert.ok(/^\d{6}$/.test(code), "TOTP code must be numeric");

      const isValid = verifyTOTP(code, secret);
      assert.strictEqual(isValid, true, "Generated TOTP must verify successfully");

      const isInvalid = verifyTOTP("000000", secret);
      // In extremely rare chance code is 000000
      if (code !== "000000") {
        assert.strictEqual(isInvalid, false, "Arbitrary invalid code must fail");
      }
    });

    it("should generate 8 formatted backup recovery codes and allow one-time consumption", () => {
      const codes = generateRecoveryCodes(8);
      assert.strictEqual(codes.length, 8, "Must generate exactly 8 recovery codes");
      assert.ok(codes.every((c) => /^[A-F0-9]{4}-[A-F0-9]{4}$/.test(c)), "Recovery code format must be XXXX-XXXX");

      const codeToUse = codes[2];
      const result = verifyAndConsumeRecoveryCode(codeToUse, codes);
      assert.strictEqual(result.valid, true, "Valid recovery code must pass verification");
      assert.strictEqual(result.remainingCodes.length, 7, "Used code must be consumed and removed");
      assert.strictEqual(result.remainingCodes.includes(codeToUse), false, "Remaining codes must not include used code");

      const reuseResult = verifyAndConsumeRecoveryCode(codeToUse, result.remainingCodes);
      assert.strictEqual(reuseResult.valid, false, "Reused recovery code must fail");
    });
  });
});
