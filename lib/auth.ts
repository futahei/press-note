import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { ADMIN_COOKIE_NAME, adminCookieOptions, issueAdminToken, verifyAdminToken } from "@/lib/session";

export { ADMIN_COOKIE_NAME, adminCookieOptions, issueAdminToken, verifyAdminToken };

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = env("ADMIN_PASSWORD_HASH");
  if (!hash && process.env.NODE_ENV !== "production") {
    return password === "admin";
  }
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export async function isAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}
