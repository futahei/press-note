import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/security";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true });
}
