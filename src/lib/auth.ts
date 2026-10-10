import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./db";

const JWT_SECRET = process.env.AUTH_SECRET || "fallback-secret-canh-gac-website-2026";
const COOKIE_NAME = "cgw_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export async function getApiUser(req: NextRequest) {
  // Check authorization header
  const authHeader = req.headers.get("authorization");
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    // Check cookie
    token = req.cookies.get(COOKIE_NAME)?.value;
  }

  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
  });

  return user;
}

export function sign2FATempToken(userId: string): string {
  return jwt.sign({ userId, purpose: "2fa_pending" }, JWT_SECRET, { expiresIn: "5m" });
}

export function verify2FATempToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; purpose?: string };
    if (decoded && decoded.purpose === "2fa_pending" && decoded.userId) {
      return { userId: decoded.userId };
    }
    return null;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
