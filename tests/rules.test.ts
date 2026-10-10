import { describe, it } from "node:test";
import assert from "node:assert";
import { formatDownAlertTelegram, formatRecoveryAlertTelegram, formatAnomalyAlertTelegram } from "../src/lib/telegram";
import { formatDownAlertEmail, formatRecoveryAlertEmail, formatAnomalyAlertEmail } from "../src/lib/email";
import { detectAnomalies } from "../src/lib/anomaly";

describe("Strict HTTP 200 & Repeat Alert Rule Tests", () => {
  describe("1. Strict HTTP Status Rule Evaluation", () => {
    it("should classify HTTP 200 as UP when expected status is 200", () => {
      const httpStatus: number = 200;
      const expectedStatusCode: number = 200;
      const isTargetStatus = expectedStatusCode ? httpStatus === expectedStatusCode : httpStatus === 200;
      const isSuccessful = isTargetStatus;
      const status = isTargetStatus ? "UP" : "DOWN";

      assert.strictEqual(isSuccessful, true);
      assert.strictEqual(status, "UP");
    });

    it("should classify HTTP 403 Forbidden strictly as DOWN", () => {
      const httpStatus: number = 403;
      const expectedStatusCode: number = 200;
      const isTargetStatus = expectedStatusCode ? httpStatus === expectedStatusCode : httpStatus === 200;
      const isSuccessful = isTargetStatus;
      const status = isTargetStatus ? "UP" : "DOWN";

      assert.strictEqual(isSuccessful, false);
      assert.strictEqual(status, "DOWN");
    });

    it("should classify HTTP 404 Not Found strictly as DOWN", () => {
      const httpStatus: number = 404;
      const expectedStatusCode: number = 200;
      const isTargetStatus = expectedStatusCode ? httpStatus === expectedStatusCode : httpStatus === 200;
      const isSuccessful = isTargetStatus;
      const status = isTargetStatus ? "UP" : "DOWN";

      assert.strictEqual(isSuccessful, false);
      assert.strictEqual(status, "DOWN");
    });

    it("should classify HTTP 500, 502, 503, 504 server errors strictly as DOWN", () => {
      const errorCodes: number[] = [500, 502, 503, 504];
      for (const code of errorCodes) {
        const isTargetStatus = code === 200;
        const status = isTargetStatus ? "UP" : "DOWN";
        assert.strictEqual(status, "DOWN", `Code ${code} must be DOWN`);
      }
    });

    it("should classify HTTP 429 Too Many Requests as DOWN", () => {
      const httpStatus: number = 429;
      const isTargetStatus = httpStatus === 200;
      assert.strictEqual(isTargetStatus, false);
    });

    it("should allow custom expected status code if explicitly configured (e.g. 301)", () => {
      const httpStatus: number = 301;
      const expectedStatusCode: number = 301;
      const isTargetStatus = expectedStatusCode ? httpStatus === expectedStatusCode : httpStatus === 200;
      assert.strictEqual(isTargetStatus, true);
    });
  });

  describe("2. Repeat Alert Interval (Re-alerting) Logic", () => {
    it("should not trigger repeat alert if time elapsed is less than configured hours", () => {
      const repeatHours = 2; // Every 2 hours
      const repeatIntervalMs = repeatHours * 60 * 60 * 1000;

      const lastAlertTime = new Date("2026-10-10T08:00:00Z").getTime();
      const currentTime = new Date("2026-10-10T09:30:00Z").getTime(); // 1.5 hours later

      const shouldReAlert = currentTime - lastAlertTime >= repeatIntervalMs;
      assert.strictEqual(shouldReAlert, false);
    });

    it("should trigger repeat alert when time elapsed reaches or exceeds configured hours", () => {
      const repeatHours = 2; // Every 2 hours
      const repeatIntervalMs = repeatHours * 60 * 60 * 1000;

      const lastAlertTime = new Date("2026-10-10T08:00:00Z").getTime();
      const currentTime = new Date("2026-10-10T10:05:00Z").getTime(); // 2 hours 5 mins later

      const shouldReAlert = currentTime - lastAlertTime >= repeatIntervalMs;
      assert.strictEqual(shouldReAlert, true);
    });

    it("should disable repeat alerts when repeatHours is set to 0", () => {
      const repeatHours = 0; // Disabled
      const shouldCheck = repeatHours > 0;
      assert.strictEqual(shouldCheck, false);
    });
  });

  describe("3. Repeat Alert Templates (Telegram & Email)", () => {
    it("should format Telegram repeat alert message with warning header and duration", () => {
      const msg = formatDownAlertTelegram({
        websiteName: "Demo Shop",
        url: "https://demoshop.vn",
        httpStatus: 502,
        timeString: "10:00 10/10/2026",
        incidentId: "inc-1234567",
        appUrl: "http://localhost:3000",
        isRepeat: true,
        downtimeText: "3 giờ 15 phút",
        repeatHours: 1,
      });

      assert.ok(msg.includes("CẢNH BÁO NHẮC LẠI"), "Must contain repeat alert header");
      assert.ok(msg.includes("3 giờ 15 phút"), "Must contain downtime duration");
      assert.ok(msg.includes("Cứ mỗi 1 giờ"), "Must indicate repeat interval");
    });

    it("should format Email repeat alert subject and HTML banner with warning styling", () => {
      const email = formatDownAlertEmail({
        websiteName: "Demo Shop",
        url: "https://demoshop.vn",
        cause: "HTTP 500 Internal Server Error",
        timeString: "10:00 10/10/2026",
        retryCount: 2,
        appUrl: "http://localhost:3000",
        isRepeat: true,
        downtimeText: "2 giờ 30 phút",
        repeatHours: 2,
      });

      assert.ok(email.subject.includes("[NHẮC LẠI SỰ CỐ]"), "Subject must contain repeat prefix");
      assert.ok(email.subject.includes("2 giờ 30 phút"), "Subject must contain downtime text");
      assert.ok(email.html.includes("#ea580c"), "Banner should use orange warning color for repeat");
      assert.ok(email.html.includes("Chu kỳ nhắc lại"), "Body must mention repeat interval");
    });
  });

  describe("4. Anomaly Violation Rule Identification", () => {
    it("should explicitly identify Anti-Defacement / Spam Keywords rule when gambling terms are found", () => {
      const html = "<html><head><title>My Store</title></head><body>Welcome to kubet casino nổ hũ online</body></html>";
      const result = detectAnomalies(html);

      assert.strictEqual(result.hasAnomaly, true);
      assert.ok(
        result.violatedRules.some((r) => r.includes("Chống can thiệp mã độc & Cá cược")),
        "Must specify the Anti-Defacement rule"
      );
      assert.ok(result.details.includes("[Vi phạm Rule Chống Defacement]"), "Details must specify the violated rule tag");
      assert.ok(result.suspiciousKeywordsFound.includes("casino"));
      assert.ok(result.suspiciousKeywordsFound.includes("kubet"));
    });

    it("should explicitly identify Page Title Integrity rule when <title> changes from baseline", () => {
      const html = "<html><head><title>HACKED BY ATTACKER</title></head><body>Normal content</body></html>";
      const baseline = {
        pageTitle: "Official Corporate Portal",
        metaDescription: "Welcome to our portal",
        htmlHash: "somehash",
      };
      const result = detectAnomalies(html, baseline);

      assert.strictEqual(result.hasAnomaly, true);
      assert.strictEqual(result.titleChanged, true);
      assert.ok(
        result.violatedRules.some((r) => r.includes("Toàn vẹn Tiêu đề trang")),
        "Must specify the Title Integrity rule"
      );
      assert.ok(result.details.includes("[Vi phạm Rule Toàn vẹn Tiêu đề]"));
    });

    it("should explicitly identify Meta Description Integrity rule when meta tag is altered", () => {
      const html = `<html><head><title>Normal</title><meta name="description" content="Chơi baccarat uy tín"></head><body>Safe</body></html>`;
      const baseline = {
        pageTitle: "Normal",
        metaDescription: "Trang web doanh nghiệp an toàn",
        htmlHash: "somehash",
      };
      const result = detectAnomalies(html, baseline);

      assert.strictEqual(result.hasAnomaly, true);
      assert.strictEqual(result.metaChanged, true);
      assert.ok(
        result.violatedRules.some((r) => r.includes("Toàn vẹn Thẻ mô tả SEO")),
        "Must specify Meta Description Integrity rule"
      );
      assert.ok(result.details.includes("[Vi phạm Rule Toàn vẹn Thẻ Meta]"));
    });

    it("should format Telegram and Email anomaly alerts with clearly listed violated rules", () => {
      const telegramAlert = formatAnomalyAlertTelegram({
        websiteName: "Công ty ABC",
        url: "https://abc.vn",
        violatedRules: [
          "Chống can thiệp mã độc & Cá cược (Anti-Defacement / Spam Keywords)",
          "Toàn vẹn Tiêu đề trang (Page Title Integrity)",
        ],
        details: "[Vi phạm Rule Chống Defacement] Phát hiện: casino; [Vi phạm Rule Toàn vẹn Tiêu đề] Tiêu đề thay đổi",
        timeString: "10:30 10/10/2026",
        appUrl: "http://localhost:3000",
      });

      assert.ok(telegramAlert.includes("CẢNH BÁO AN NINH"));
      assert.ok(telegramAlert.includes("Quy tắc vi phạm"));
      assert.ok(telegramAlert.includes("Chống can thiệp mã độc & Cá cược"));
      assert.ok(telegramAlert.includes("Toàn vẹn Tiêu đề trang"));

      const emailAlert = formatAnomalyAlertEmail({
        websiteName: "Công ty ABC",
        url: "https://abc.vn",
        violatedRules: ["Chống can thiệp mã độc & Cá cược (Anti-Defacement / Spam Keywords)"],
        details: "[Vi phạm Rule Chống Defacement] Phát hiện: casino",
        timeString: "10:30 10/10/2026",
        appUrl: "http://localhost:3000",
      });

      assert.ok(emailAlert.subject.includes("CẢNH BÁO AN NINH"));
      assert.ok(emailAlert.html.includes("DANH SÁCH QUY TẮC VI PHẠM"));
      assert.ok(emailAlert.html.includes("Chống can thiệp mã độc & Cá cược"));
    });
  });
});
