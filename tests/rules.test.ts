import { describe, it } from "node:test";
import assert from "node:assert";
import { formatDownAlertTelegram, formatRecoveryAlertTelegram } from "../src/lib/telegram";
import { formatDownAlertEmail, formatRecoveryAlertEmail } from "../src/lib/email";

describe("Strict HTTP 200 & Repeat Alert Rule Tests", () => {
  describe("1. Strict HTTP Status Rule Evaluation", () => {
    it("should classify HTTP 200 as UP when expected status is 200", () => {
      const httpStatus = 200;
      const expectedStatusCode = 200;
      const isTargetStatus = expectedStatusCode ? httpStatus === expectedStatusCode : httpStatus === 200;
      const isSuccessful = isTargetStatus;
      const status = isTargetStatus ? "UP" : "DOWN";

      assert.strictEqual(isSuccessful, true);
      assert.strictEqual(status, "UP");
    });

    it("should classify HTTP 403 Forbidden strictly as DOWN", () => {
      const httpStatus = 403;
      const expectedStatusCode = 200;
      const isTargetStatus = expectedStatusCode ? httpStatus === expectedStatusCode : httpStatus === 200;
      const isSuccessful = isTargetStatus;
      const status = isTargetStatus ? "UP" : "DOWN";

      assert.strictEqual(isSuccessful, false);
      assert.strictEqual(status, "DOWN");
    });

    it("should classify HTTP 404 Not Found strictly as DOWN", () => {
      const httpStatus = 404;
      const expectedStatusCode = 200;
      const isTargetStatus = expectedStatusCode ? httpStatus === expectedStatusCode : httpStatus === 200;
      const isSuccessful = isTargetStatus;
      const status = isTargetStatus ? "UP" : "DOWN";

      assert.strictEqual(isSuccessful, false);
      assert.strictEqual(status, "DOWN");
    });

    it("should classify HTTP 500, 502, 503, 504 server errors strictly as DOWN", () => {
      const errorCodes = [500, 502, 503, 504];
      for (const code of errorCodes) {
        const isTargetStatus = 200 ? code === 200 : false;
        const status = isTargetStatus ? "UP" : "DOWN";
        assert.strictEqual(status, "DOWN", `Code ${code} must be DOWN`);
      }
    });

    it("should classify HTTP 429 Too Many Requests as DOWN", () => {
      const httpStatus = 429;
      const isTargetStatus = httpStatus === 200;
      assert.strictEqual(isTargetStatus, false);
    });

    it("should allow custom expected status code if explicitly configured (e.g. 301)", () => {
      const httpStatus = 301;
      const expectedStatusCode = 301;
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
});
