import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  const publicKey = env("VAPID_PUBLIC_KEY");
  if (!publicKey) return NextResponse.json({ error: "VAPID public key is not configured" }, { status: 503 });
  return NextResponse.json({ publicKey });
}
