import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getApiUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Chưa đăng nhập", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const website = await prisma.website.findUnique({
      where: { id: params.id },
    });

    if (!website || website.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy website", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const updated = await prisma.website.update({
      where: { id: params.id },
      data: {
        currentState: "ACTIVE",
        status: "UP",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã kích hoạt lại giám sát website",
      data: updated,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
    return NextResponse.json(
      { success: false, message: errMsg, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
