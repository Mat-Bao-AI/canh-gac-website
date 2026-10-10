import crypto from "crypto";

// RFC 4648 Base32 Alphabet
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Tạo Secret Key ngẫu nhiên chuẩn Base32
 */
export function generateSecret(length = 20): string {
  return base32Encode(crypto.randomBytes(length));
}

/**
 * Sinh mã TOTP 6 chữ số theo RFC 6238
 */
export function generateTOTP(secret: string, time = Date.now(), step = 30): string {
  const key = base32Decode(secret);
  const epoch = Math.floor(time / 1000);
  const counter = Math.floor(epoch / step);

  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;

  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, "0");
}

/**
 * Xác thực mã TOTP (cho phép lệch ±1 chu kỳ 30 giây)
 */
export function verifyTOTP(token: string, secret: string, window = 1): boolean {
  if (!token || !secret) return false;
  const cleanedToken = token.trim();
  const now = Date.now();
  const step = 30;

  for (let i = -window; i <= window; i++) {
    const checkTime = now + i * step * 1000;
    const expected = generateTOTP(secret, checkTime, step);
    if (expected === cleanedToken) {
      return true;
    }
  }
  return false;
}

/**
 * Sinh URL chuẩn otpauth:// để quét qua Google Authenticator / Microsoft Authenticator
 */
export function getOtpAuthUrl(secret: string, email: string, issuer = "Canh Gac Website"): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Sinh danh sách mã khôi phục dự phòng (Recovery Codes)
 */
export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Mã dạng 8 ký tự hex: xxxx-xxxx
    const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${rand.slice(0, 4)}-${rand.slice(4)}`);
  }
  return codes;
}

/**
 * Kiểm tra và tiêu thụ một mã dự phòng
 */
export function verifyAndConsumeRecoveryCode(
  inputCode: string,
  storedCodes: string[]
): { valid: boolean; remainingCodes: string[] } {
  const normalized = inputCode.trim().toUpperCase();
  const index = storedCodes.findIndex(
    (c) => c.toUpperCase() === normalized || c.replace(/-/g, "").toUpperCase() === normalized.replace(/-/g, "")
  );

  if (index === -1) {
    return { valid: false, remainingCodes: storedCodes };
  }

  const remaining = [...storedCodes];
  remaining.splice(index, 1);
  return { valid: true, remainingCodes: remaining };
}
