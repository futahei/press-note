import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/cron";

export async function POST(request: Request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    data: {
      job: "notify",
      delivered: 0,
      skipped: 0,
      note: "Web Push 接続後に 30 分枠の購読へ配信する"
    }
  });
}

