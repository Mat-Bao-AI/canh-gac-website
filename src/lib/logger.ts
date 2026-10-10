type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

interface LogPayload {
  [key: string]: unknown;
}

const SENSITIVE_KEYS = ["password", "password_hash", "token", "secret", "smtp_pass", "authorization"];

function sanitize(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(sanitize);

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      clean[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      clean[key] = sanitize(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

function formatLog(level: LogLevel, message: string, payload?: LogPayload): string {
  const timestamp = new Date().toISOString();
  const entry: Record<string, unknown> = {
    timestamp,
    level,
    message,
  };
  if (payload) {
    entry.data = sanitize(payload);
  }
  return JSON.stringify(entry);
}

export const logger = {
  debug(message: string, payload?: LogPayload) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatLog("DEBUG", message, payload));
    }
  },
  info(message: string, payload?: LogPayload) {
    console.log(formatLog("INFO", message, payload));
  },
  warn(message: string, payload?: LogPayload) {
    console.warn(formatLog("WARN", message, payload));
  },
  error(message: string, payload?: LogPayload) {
    console.error(formatLog("ERROR", message, payload));
  },
};
