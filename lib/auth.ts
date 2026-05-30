import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { ADMIN_COOKIE_NAME, adminCookieOptions, issueAdminToken, verifyAdminToken } from "@/lib/session";

export { ADMIN_COOKIE_NAME, adminCookieOptions, issueAdminToken, verifyAdminToken };

const bcryptHashPattern = /^\$2[aby]\$\d{2}\$/;

function isBcryptHash(value: string | undefined): value is string {
  return Boolean(value && bcryptHashPattern.test(value));
}

function readRawEnvValue(name: string): string | undefined {
  for (const filename of [".env.local", ".env"]) {
    const path = join(process.cwd(), filename);
    if (!existsSync(path)) continue;

    const line = readFileSync(path, "utf8")
      .split(/\r?\n/)
      .find((entry) => entry.match(new RegExp(`^\\s*${name}\\s*=`)));
    if (!line) continue;

    let value = line.replace(new RegExp(`^\\s*${name}\\s*=`), "").trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value.replace(/\\\$/g, "$");
  }

  return undefined;
}

function adminPasswordHash(): string | undefined {
  const parsedHash = env("ADMIN_PASSWORD_HASH");
  if (isBcryptHash(parsedHash)) return parsedHash;

  if (parsedHash) {
    const rawHash = readRawEnvValue("ADMIN_PASSWORD_HASH");
    if (isBcryptHash(rawHash)) return rawHash;
  }

  return parsedHash;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = adminPasswordHash();
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
