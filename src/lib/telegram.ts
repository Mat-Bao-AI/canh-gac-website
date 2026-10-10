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
  isRepeat?: boolean;
  downtimeText?: string;
  repeatHours?: number;
}): string {
  const statusText = params.httpStatus ? `HTTP ${params.httpStatus}` : (params.errorMessage || "Không thể kết nối");
  const title = params.isRepeat
    ? `⚠️ <b>[CẢNH BÁO NHẮC LẠI: SỰ CỐ VẪN ĐANG DIỄN RA]</b>`
    : `🚨 <b>[CẢNH BÁO: WEBSITE GẶP SỰ CỐ]</b>`;

  const repeatDetail = params.downtimeText
    ? `\n• <b>Thời gian gián đoạn:</b> <code>${params.downtimeText}</code>`
    : "";

  const repeatInterval = params.repeatHours
    ? `\n• <b>Chu kỳ nhắc lại:</b> Cứ mỗi ${params.repeatHours} giờ một lần`
    : "";

  return `${title}

• <b>Website:</b> ${params.websiteName}
• <b>URL:</b> ${params.url}
• <b>Trạng thái:</b> <code>${statusText}</code>${repeatDetail}
• <b>Thời gian:</b> ${params.timeString}
• <b>Mã sự cố:</b> <code>#${params.incidentId.slice(-7).toUpperCase()}</code>${repeatInterval}

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

export function formatAnomalyAlertTelegram(params: {
  websiteName: string;
  url: string;
  violatedRules: string[];
  details: string;
  timeString: string;
  appUrl: string;
}): string {
  const rulesList = params.violatedRules.length > 0
    ? params.violatedRules.map((r) => `  - <code>${r}</code>`).join("\n")
    : "  - <code>Quy tắc toàn vẹn nội dung website</code>";

  return `🛡️ <b>[CẢNH BÁO AN NINH: PHÁT HIỆN BẤT THƯỜNG NỘI DUNG]</b>

• <b>Website:</b> ${params.websiteName}
• <b>URL:</b> ${params.url}
• <b>Quy tắc vi phạm:</b>
${rulesList}

• <b>Bằng chứng chi tiết:</b>
${params.details}

• <b>Thời gian quét:</b> ${params.timeString}

» <a href="${params.appUrl}/alerts">Xem chi tiết trên Trung tâm cảnh báo</a>`;
}

