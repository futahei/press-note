import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { env, requiredEnv } from "@/lib/env";

export const ADMIN_COOKIE_NAME = "pressnote_admin";
const encoder = new TextEncoder();

function getJwtSecret(): Uint8Array {
  return encoder.encode(requiredEnv("ADMIN_JWT_SECRET"));
}

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = env("ADMIN_PASSWORD_HASH");
  if (!hash && process.env.NODE_ENV !== "production") {
    return password === "admin";
  }
  if (!hash) return false;
  return bcrypt.compare(password, hash);
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

export async function isAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
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
