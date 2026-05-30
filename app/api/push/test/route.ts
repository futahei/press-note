import { NextRequest, NextResponse } from "next/server";
import { sendTestNotification } from "@/lib/push";

export async function POST(request: NextRequest) {
  const { endpoint } = (await request.json()) as { endpoint?: string };
  if (!endpoint) return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
  return NextResponse.json(await sendTestNotification(endpoint));
}
