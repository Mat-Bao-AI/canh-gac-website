import crypto from "crypto";

const DEFAULT_SUSPICIOUS_KEYWORDS = [
  "casino",
  "betting",
  "gambling",
  "cá cược",
  "casino online",
  "sbobet",
  "kubet",
  "keonhacai",
  "baccarat",
  "nohu",
  "nổ hũ",
  "link ẩn",
  "đá gà",
  "lô đề",
  "slot game",
  "hacked by",
  "defaced by",
];

// Ngữ cảnh chính sách/pháp lý an toàn (loại trừ false-positive trên các website có điều khoản dịch vụ/chống tấn công)
const SAFE_POLICY_MARKERS = [
  "nghiêm cấm",
  "cấm sử dụng",
  "cấm các dịch vụ",
  "hành vi cấm",
  "không được phép",
  "ngăn chặn",
  "phòng chống",
  "phòng ngừa",
  "chính sách",
  "điều khoản",
  "quy định",
  "nghị định",
  "trái phép",
  "vi phạm pháp luật",
  "bị cấm",
  "bảo vệ tên miền",
  "an toàn thông tin",
  "cảnh báo lừa đảo",
  "xử lý vi phạm",
  "lỗ hổng bảo mật",
  "tấn công mạng",
  "bị hack",
  "rò rỉ thông tin",
  "thỏa thuận",
];

function isSafePolicyContext(html: string, matchIndex: number): boolean {
  // Kiểm tra cửa sổ 250 ký tự phía trước và 150 ký tự phía sau
  const start = Math.max(0, matchIndex - 250);
  const end = Math.min(html.length, matchIndex + 150);
  const surroundingText = html.substring(start, end).toLowerCase();

  return SAFE_POLICY_MARKERS.some((marker) => surroundingText.includes(marker));
}

export interface AnomalyScanResult {
  htmlHash: string;
  pageTitle: string;
  metaDescription: string;
  hasAnomaly: boolean;
  titleChanged: boolean;
  metaChanged: boolean;
  suspiciousKeywordsFound: string[];
  externalLinks: string[];
  violatedRules: string[];
  details: string;
}

export function extractHtmlMetadata(html: string): {
  pageTitle: string;
  metaDescription: string;
  externalLinks: string[];
  htmlHash: string;
} {
  // Title extraction
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : "";

  // Meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : "";

  // External links extraction
  const linkMatches = Array.from(html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi));
  const externalLinks: string[] = [];
  for (const m of linkMatches) {
    if (m[1] && !externalLinks.includes(m[1]) && externalLinks.length < 50) {
      externalLinks.push(m[1]);
    }
  }

  // Hash of cleaned body
  const htmlHash = crypto.createHash("sha256").update(html).digest("hex");

  return {
    pageTitle,
    metaDescription,
    externalLinks,
    htmlHash,
  };
}

export function detectAnomalies(
  html: string,
  baseline?: {
    htmlHash?: string | null;
    pageTitle?: string | null;
    metaDescription?: string | null;
  }
): AnomalyScanResult {
  const { pageTitle, metaDescription, externalLinks, htmlHash } = extractHtmlMetadata(html);

  const lowerHtml = html.toLowerCase();
  const suspiciousKeywordsFound: string[] = [];

  for (const kw of DEFAULT_SUSPICIOUS_KEYWORDS) {
    const kwLower = kw.toLowerCase();
    let idx = 0;
    while ((idx = lowerHtml.indexOf(kwLower, idx)) !== -1) {
      if (!isSafePolicyContext(lowerHtml, idx)) {
        if (!suspiciousKeywordsFound.includes(kw)) {
          suspiciousKeywordsFound.push(kw);
        }
        break;
      }
      idx += kwLower.length;
    }
  }

  let titleChanged = false;
  let metaChanged = false;

  if (baseline) {
    if (baseline.pageTitle && baseline.pageTitle !== pageTitle) {
      titleChanged = true;
    }
    if (baseline.metaDescription && baseline.metaDescription !== metaDescription) {
      metaChanged = true;
    }
  }

  const hasAnomaly = suspiciousKeywordsFound.length > 0 || titleChanged || metaChanged;

  const violatedRules: string[] = [];
  const reasons: string[] = [];

  if (suspiciousKeywordsFound.length > 0) {
    violatedRules.push("Chống can thiệp mã độc & Cá cược (Anti-Defacement / Spam Keywords)");
    reasons.push(
      `[Vi phạm Rule Chống Defacement] Phát hiện từ khóa nghi vấn cờ bạc/mã độc: "${suspiciousKeywordsFound.join('", "')}"`
    );
  }

  if (titleChanged) {
    violatedRules.push("Toàn vẹn Tiêu đề trang (Page Title Integrity)");
    reasons.push(
      `[Vi phạm Rule Toàn vẹn Tiêu đề] Tiêu đề bị thay đổi (Gốc: "${baseline?.pageTitle || ""}" ➔ Hiện tại: "${pageTitle}")`
    );
  }

  if (metaChanged) {
    violatedRules.push("Toàn vẹn Thẻ mô tả SEO (Meta Description Integrity)");
    reasons.push(
      `[Vi phạm Rule Toàn vẹn Thẻ Meta] Thẻ mô tả bị thay đổi (Gốc: "${baseline?.metaDescription || ""}" ➔ Hiện tại: "${metaDescription}")`
    );
  }

  return {
    htmlHash,
    pageTitle,
    metaDescription,
    hasAnomaly,
    titleChanged,
    metaChanged,
    suspiciousKeywordsFound,
    externalLinks,
    violatedRules,
    details: reasons.length > 0 ? reasons.join("; ") : "Nội dung bình thường, không có dấu hiệu bất thường",
  };
}
