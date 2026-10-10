import { logger } from "./logger";

export interface SendTelegramMessageOptions {
  botToken: string;
  chatId: string;
  message: string;
  parseMode?: "HTML" | "MarkdownV2" | "Markdown";
}

export async function sendTelegramMessage(options: SendTelegramMessageOptions): Promise<{ success: boolean; error?: string }> {
  const { botToken, chatId, message, parseMode = "HTML" } = options;

  if (!botToken || !chatId) {
    return { success: false, error: "Thiếu Bot Token hoặc Chat ID" };
  }

  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      const errMsg = data.description || `HTTP ${res.status}`;
      logger.error("Telegram API Error", { error: errMsg, chatId });
      return { success: false, error: errMsg };
    }

    logger.info("Telegram notification sent successfully", { chatId });
    return { success: true };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error("Telegram network exception", { error: errMsg, chatId });
    return { success: false, error: errMsg };
  }
}

export function formatDownAlertTelegram(params: {
  websiteName: string;
  url: string;
  httpStatus?: number | null;
  errorMessage?: string | null;
  timeString: string;
  incidentId: string;
  appUrl: string;
}): string {
  const statusText = params.httpStatus ? `HTTP ${params.httpStatus}` : (params.errorMessage || "Không thể kết nối");
  return `<b>[CẢNH BÁO: WEBSITE GẶP SỰ CỐ]</b>

• <b>Website:</b> ${params.websiteName}
• <b>URL:</b> ${params.url}
• <b>Trạng thái:</b> <code>${statusText}</code>
• <b>Thời gian:</b> ${params.timeString}
• <b>Mã sự cố:</b> <code>#${params.incidentId.slice(-7).toUpperCase()}</code>

» <a href="${params.appUrl}/incidents">Xem chi tiết trên Canh Gác Website</a>`;
}

export function formatRecoveryAlertTelegram(params: {
  websiteName: string;
  url: string;
  downtimeText: string;
  timeString: string;
  responseTime: number;
  appUrl: string;
}): string {
  return `<b>[THÔNG BÁO: WEBSITE ĐÃ PHỤC HỒI]</b>

• <b>Website:</b> ${params.websiteName}
• <b>URL:</b> ${params.url}
• <b>Trạng thái:</b> Đã hoạt động ổn định trở lại
• <b>Thời gian Downtime:</b> ${params.downtimeText}
• <b>Độ trễ phản hồi:</b> ${params.responseTime} ms
• <b>Thời điểm phục hồi:</b> ${params.timeString}

» <a href="${params.appUrl}/overview">Xem chi tiết trên Dashboard</a>`;
}

export function formatSSLAlertTelegram(params: {
  websiteName: string;
  url: string;
  daysRemaining: number;
  expiresAt: string;
  appUrl: string;
}): string {
  return `<b>[CẢNH BÁO: CHỨNG CHỈ SSL SẮP HẾT HẠN]</b>

• <b>Website:</b> ${params.websiteName}
• <b>URL:</b> ${params.url}
• <b>Thời hạn còn lại:</b> <b>${params.daysRemaining} ngày</b>
• <b>Ngày hết hạn:</b> ${params.expiresAt}

» Vui lòng gia hạn chứng chỉ SSL sớm để tránh gián đoạn truy cập.`;
}
