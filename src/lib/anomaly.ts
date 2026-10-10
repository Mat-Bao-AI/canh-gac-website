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
  "hack",
  "phishing",
];

export interface AnomalyScanResult {
  htmlHash: string;
  pageTitle: string;
  metaDescription: string;
  hasAnomaly: boolean;
  titleChanged: boolean;
  metaChanged: boolean;
  suspiciousKeywordsFound: string[];
  externalLinks: string[];
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
    if (lowerHtml.includes(kw.toLowerCase())) {
      suspiciousKeywordsFound.push(kw);
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

  const reasons: string[] = [];
  if (titleChanged) reasons.push("Tiêu đề website bị thay đổi so với baseline");
  if (metaChanged) reasons.push("Thẻ meta description bị thay đổi");
  if (suspiciousKeywordsFound.length > 0) {
    reasons.push(`Phát hiện từ khóa nghi vấn: ${suspiciousKeywordsFound.join(", ")}`);
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
    details: reasons.length > 0 ? reasons.join("; ") : "Nội dung bình thường, không có dấu hiệu bất thường",
  };
}
