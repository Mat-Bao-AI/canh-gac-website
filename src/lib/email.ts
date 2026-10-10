import nodemailer from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from?: string;
}

export interface SendEmailOptions {
  config: SmtpConfig;
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendSmtpEmail({
  config,
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!config.host || !config.user || !config.pass) {
      return { success: false, error: "Thiếu thông tin cấu hình SMTP (Host, User hoặc Password)" };
    }

    const port = Number(config.port) || 587;
    const isSecure = port === 465;

    const transporter = nodemailer.createTransport({
      host: config.host,
      port,
      secure: isSecure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false, // Hỗ trợ chứng chỉ tự ký hoặc proxy
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    const fromAddress = config.from || config.user;

    const info = await transporter.sendMail({
      from: `"Canh Gác Website" <${fromAddress}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ""),
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Lỗi gửi email không xác định";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

// 1. Template Email Sự cố gián đoạn (DOWN)
export function formatDownAlertEmail({
  websiteName,
  url,
  cause,
  timeString,
  retryCount,
  appUrl,
  isRepeat,
  downtimeText,
  repeatHours,
}: {
  websiteName: string;
  url: string;
  cause: string;
  timeString: string;
  retryCount: number;
  appUrl: string;
  isRepeat?: boolean;
  downtimeText?: string;
  repeatHours?: number;
}): { subject: string; html: string } {
  const subject = isRepeat
    ? `⚠️ [NHẮC LẠI SỰ CỐ] Website ${websiteName} vẫn đang gián đoạn (${downtimeText || "chưa phục hồi"})!`
    : `🚨 [CẢNH BÁO SỰ CỐ] Website ${websiteName} không thể truy cập!`;

  const bannerTitle = isRepeat
    ? `⚠️ NHẮC LẠI: WEBSITE VẪN ĐANG GIÁN ĐOẠN`
    : `🚨 PHÁT HIỆN SỰ CỐ WEBSITE GIÁN ĐOẠN`;

  const introText = isRepeat
    ? `Hệ thống xin nhắc lại: Website của bạn <b>vẫn đang gặp sự cố gián đoạn liên tục</b> (Thời gian đã sập: <b>${downtimeText || "kéo dài"}</b>):`
    : `Hệ thống vừa phát hiện website của bạn không phản hồi sau <b>${retryCount}</b> lượt kiểm tra liên tiếp:`;

  const repeatNote = repeatHours
    ? `<div style="margin-top: 8px; font-size: 13px; color: #475569;"><b>Chu kỳ nhắc lại:</b> Cứ mỗi <b>${repeatHours} giờ</b> cho đến khi sự cố được khắc phục.</div>`
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b; margin: 0;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="background: ${isRepeat ? "#ea580c" : "#e11d48"}; padding: 20px 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 700;">${bannerTitle}</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Hệ thống giám sát 24/7 Canh Gác Website</p>
        </div>
        <div style="padding: 24px;">
          <p style="margin-top: 0; font-size: 15px;">${introText}</p>
          <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 14px; line-height: 1.6;">
            <div><b>Tên website:</b> ${websiteName}</div>
            <div><b>Địa chỉ URL:</b> <a href="${url}" style="color: #2563eb;">${url}</a></div>
            <div><b>Thời gian ghi nhận:</b> ${timeString}</div>
            <div><b>Nguyên nhân:</b> <span style="color: #e11d48; font-weight: 600;">${cause}</span></div>
            ${downtimeText ? `<div><b>Thời gian gián đoạn:</b> <span style="color: #ea580c; font-weight: 600;">${downtimeText}</span></div>` : ""}
            ${repeatNote}
          </div>
          <p style="font-size: 13px; color: #64748b;">Vui lòng kiểm tra lại máy chủ hoặc tên miền của bạn để khắc phục sớm nhất.</p>
          <div style="margin-top: 24px; text-align: center;">
            <a href="${appUrl}/overview" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px;">Xem chi tiết sự cố trên Dashboard</a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 14px 24px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9;">
          Canh Gác Website - Nền tảng Giám sát & An ninh Website 24/7
        </div>
      </div>
    </body>
    </html>
  `;
  return { subject, html };
}

// 2. Template Email Phục hồi (RECOVERY)
export function formatRecoveryAlertEmail({
  websiteName,
  url,
  downtimeText,
  timeString,
  responseTime,
  appUrl,
}: {
  websiteName: string;
  url: string;
  downtimeText: string;
  timeString: string;
  responseTime?: number;
  appUrl: string;
}): { subject: string; html: string } {
  const subject = `🟢 [PHỤC HỒI] Website ${websiteName} đã hoạt động trở lại!`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b; margin: 0;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="background: #059669; padding: 20px 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 700;">🟢 WEBSITE ĐÃ PHỤC HỒI HOÀN TOÀN</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Canh Gác Website 24/7 Monitoring</p>
        </div>
        <div style="padding: 24px;">
          <p style="margin-top: 0; font-size: 15px;">Tin tốt! Website của bạn đã phản hồi bình thường trở lại:</p>
          <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 14px; line-height: 1.6;">
            <div><b>Tên website:</b> ${websiteName}</div>
            <div><b>Địa chỉ URL:</b> <a href="${url}" style="color: #2563eb;">${url}</a></div>
            <div><b>Thời gian phục hồi:</b> ${timeString}</div>
            <div><b>Tổng thời gian gián đoạn:</b> <span style="color: #d97706; font-weight: 600;">${downtimeText}</span></div>
            ${responseTime ? `<div><b>Thời gian phản hồi hiện tại:</b> ${responseTime} ms</div>` : ""}
          </div>
          <div style="margin-top: 24px; text-align: center;">
            <a href="${appUrl}/overview" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px;">Mở Dashboard giám sát</a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 14px 24px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9;">
          Canh Gác Website - Nền tảng Giám sát & An ninh Website 24/7
        </div>
      </div>
    </body>
    </html>
  `;
  return { subject, html };
}

// 3. Template Email Kiểm tra kết nối SMTP
export function formatTestEmail({
  userName,
  timeString,
  smtpHost,
  smtpUser,
}: {
  userName: string;
  timeString: string;
  smtpHost: string;
  smtpUser: string;
}): { subject: string; html: string } {
  const subject = `🔔 [CANH GÁC WEBSITE] Kiểm tra kết nối Email SMTP thành công!`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b; margin: 0;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="background: #2563eb; padding: 20px 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 700;">🔔 KIỂM TRA KẾT NỐI EMAIL THÀNH CÔNG</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Canh Gác Website SMTP Integration</p>
        </div>
        <div style="padding: 24px;">
          <p style="margin-top: 0; font-size: 15px;">Xin chào <b>${userName}</b>,</p>
          <p style="font-size: 14px; line-height: 1.6;">Cấu hình gửi mail qua SMTP của bạn đã được xác thực và hoạt động hoàn hảo. Từ bây giờ, mọi cảnh báo về sự cố website, chứng chỉ SSL và khôi phục hoạt động sẽ được gửi đến hộp thư này ngay tức thì.</p>
          <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px; line-height: 1.6;">
            <div><b>Máy chủ SMTP:</b> ${smtpHost}</div>
            <div><b>Tài khoản gửi:</b> ${smtpUser}</div>
            <div><b>Thời gian thử nghiệm:</b> ${timeString}</div>
            <div><b>Trạng thái:</b> <span style="color: #059669; font-weight: 600;">Sẵn sàng hoạt động 100%</span></div>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 14px 24px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9;">
          Canh Gác Website - Nền tảng Giám sát & An ninh Website 24/7
        </div>
      </div>
    </body>
    </html>
  `;
  return { subject, html };
}
