import tls from "tls";
import { URL } from "url";

export interface SSLCertificateInfo {
  valid: boolean;
  issuer: string;
  subject: string;
  validFrom: Date | null;
  expiresAt: Date | null;
  daysRemaining: number | null;
  error?: string;
  isSelfSigned?: boolean;
}

export function checkSSLCertificate(urlString: string, timeoutMs: number = 8000): Promise<SSLCertificateInfo> {
  return new Promise((resolve) => {
    let url: URL;
    try {
      url = new URL(urlString);
    } catch {
      return resolve({
        valid: false,
        issuer: "Unknown",
        subject: "Unknown",
        validFrom: null,
        expiresAt: null,
        daysRemaining: null,
        error: "URL không hợp lệ",
      });
    }

    if (url.protocol !== "https:") {
      return resolve({
        valid: false,
        issuer: "N/A (HTTP)",
        subject: "N/A (HTTP)",
        validFrom: null,
        expiresAt: null,
        daysRemaining: null,
        error: "Trang web không sử dụng HTTPS",
      });
    }

    const host = url.hostname;
    const port = url.port ? parseInt(url.port, 10) : 443;

    const options: tls.ConnectionOptions = {
      host,
      port,
      servername: host,
      rejectUnauthorized: false, // get certificate even if expired/self-signed to extract dates
      timeout: timeoutMs,
    };

    const socket = tls.connect(options, () => {
      try {
        const cert = socket.getPeerCertificate(true);
        if (!cert || Object.keys(cert).length === 0) {
          socket.destroy();
          return resolve({
            valid: false,
            issuer: "Unknown",
            subject: host,
            validFrom: null,
            expiresAt: null,
            daysRemaining: null,
            error: "Không tìm thấy chứng chỉ SSL",
          });
        }

        const validFrom = cert.valid_from ? new Date(cert.valid_from) : null;
        const expiresAt = cert.valid_to ? new Date(cert.valid_to) : null;

        let daysRemaining: number | null = null;
        let isExpired = false;

        if (expiresAt) {
          const now = Date.now();
          const diffMs = expiresAt.getTime() - now;
          daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          if (daysRemaining < 0) {
            isExpired = true;
          }
        }

        const rawIssuer =
          typeof cert.issuer === "object" && cert.issuer
            ? cert.issuer.O || cert.issuer.CN || "Unknown Issuer"
            : cert.issuer || "Unknown";
        const issuerString = Array.isArray(rawIssuer) ? rawIssuer.join(", ") : String(rawIssuer);

        const rawSubject =
          typeof cert.subject === "object" && cert.subject
            ? cert.subject.CN || cert.subject.O || host
            : cert.subject || host;
        const subjectString = Array.isArray(rawSubject) ? rawSubject.join(", ") : String(rawSubject);

        const authorized = socket.authorized;
        const valid = authorized && !isExpired;

        socket.destroy();

        return resolve({
          valid,
          issuer: issuerString,
          subject: subjectString,
          validFrom,
          expiresAt,
          daysRemaining,
          error: !valid ? (isExpired ? "Chứng chỉ SSL đã hết hạn" : socket.authorizationError?.message || "Chứng chỉ không hợp lệ") : undefined,
        });
      } catch (err: unknown) {
        socket.destroy();
        const errMessage = err instanceof Error ? err.message : String(err);
        return resolve({
          valid: false,
          issuer: "Unknown",
          subject: host,
          validFrom: null,
          expiresAt: null,
          daysRemaining: null,
          error: `Lỗi đọc chứng chỉ: ${errMessage}`,
        });
      }
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({
        valid: false,
        issuer: "Unknown",
        subject: host,
        validFrom: null,
        expiresAt: null,
        daysRemaining: null,
        error: "Quá thời gian kết nối TLS (Timeout)",
      });
    });

    socket.on("error", (err) => {
      socket.destroy();
      resolve({
        valid: false,
        issuer: "Unknown",
        subject: host,
        validFrom: null,
        expiresAt: null,
        daysRemaining: null,
        error: `Lỗi kết nối SSL: ${err.message}`,
      });
    });
  });
}
