import { jwtVerify, SignJWT } from "jose";
import { requiredEnv } from "@/lib/env";

export const ADMIN_COOKIE_NAME = "pressnote_admin";
const encoder = new TextEncoder();

function getJwtSecret(): Uint8Array {
  return encoder.encode(requiredEnv("ADMIN_JWT_SECRET"));
}

export async function issueAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(getJwtSecret());
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 90 * 24 * 60 * 60
  };
}
