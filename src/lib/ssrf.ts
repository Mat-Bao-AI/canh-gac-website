import dns from "dns/promises";

// Blocked private IPv4 ranges & patterns
const PRIVATE_IPV4_PATTERNS = [
  /^127\./,                         // Loopback 127.0.0.0/8
  /^10\./,                          // RFC1918 10.0.0.0/8
  /^192\.168\./,                    // RFC1918 192.168.0.0/16
  /^169\.254\./,                    // Link-local / Cloud metadata 169.254.0.0/16
  /^0\./,                           // Current network 0.0.0.0/8
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // CGNAT 100.64.0.0/10
  /^198\.18\./,                     // Benchmark 198.18.0.0/15
];

// 172.16.0.0 – 172.31.255.255
function isClassBPrivate(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length === 4 && parts[0] === 172) {
    return parts[1] >= 16 && parts[1] <= 31;
  }
  return false;
}

// Blocked IPv6
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fe80:") || // link-local
    normalized.startsWith("fc00:") || // unique local
    normalized.startsWith("fd00:") ||
    normalized.startsWith("::ffff:127.") || // IPv4 mapped loopback
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    normalized.startsWith("::ffff:169.254.")
  );
}

export function isIpPrivateOrReserved(ip: string): boolean {
  if (PRIVATE_IPV4_PATTERNS.some((p) => p.test(ip))) return true;
  if (isClassBPrivate(ip)) return true;
  if (isPrivateIPv6(ip)) return true;
  return false;
}

export interface SSRFValidationResult {
  isValid: boolean;
  error?: string;
  resolvedIp?: string;
  normalizedUrl?: string;
}

const BLOCKED_HOSTNAMES = [
  "localhost",
  "localhost.localdomain",
  "broadcasthost",
  "local",
  "internal",
  "metadata.google.internal",
  "instance-data",
];

export async function validateUrlAgainstSSRF(urlString: string): Promise<SSRFValidationResult> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { isValid: false, error: "Định dạng URL không hợp lệ" };
  }

  // Protocol check
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { isValid: false, error: "Chỉ cho phép giao thức http hoặc https" };
  }

  const hostname = url.hostname.toLowerCase();

  // Blocked hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return { isValid: false, error: "Tên miền nội bộ không được phép giám sát (SSRF Protection)" };
  }

  // Directly an IP?
  if (isIpPrivateOrReserved(hostname)) {
    return { isValid: false, error: "Địa chỉ IP nội bộ / riêng tư không được phép giám sát (SSRF Protection)" };
  }

  // DNS resolution check
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { isValid: false, error: "Không thể phân giải tên miền (DNS lookup failed)" };
    }

    for (const record of addresses) {
      if (isIpPrivateOrReserved(record.address)) {
        return {
          isValid: false,
          error: `Tên miền trỏ đến IP nội bộ (${record.address}) - Bị chặn bởi SSRF Protection`,
        };
      }
    }

    return {
      isValid: true,
      resolvedIp: addresses[0].address,
      normalizedUrl: url.toString(),
    };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    return {
      isValid: false,
      error: `Lỗi kiểm tra DNS: ${errMessage}`,
    };
  }
}
