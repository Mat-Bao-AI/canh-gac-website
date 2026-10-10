import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { generateSecret, getOtpAuthUrl, generateRecoveryCodes } from "@/lib/totp";

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const secret = generateSecret();
    const otpAuthUrl = getOtpAuthUrl(secret, user.email, "Canh Gac Website");
    const recoveryCodes = generateRecoveryCodes(8);

    return NextResponse.json({
      success: true,
      data: {
        secret,
        otpAuthUrl,
        recoveryCodes,
      },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi máy chủ";
    return NextResponse.json({ success: false, message: errMsg }, { status: 500 });
  }
}
