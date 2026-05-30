import { NextRequest } from "next/server";
import { env } from "@/lib/env";

export function isSafeOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const appOrigin = env("APP_ORIGIN");
  if (appOrigin && origin === appOrigin) return true;

  const host = request.headers.get("host");
  return host ? origin === `${request.nextUrl.protocol}//${host}` : false;
}

export function isCronAuthorized(request: NextRequest): boolean {
  const secret = env("CRON_SECRET");
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
