import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/cron";

export async function POST(request: Request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    data: {
      job: "crawl",
      processed_sources: 0,
      items_found: 0,
      items_new: 0,
      note: "Supabase 接続後に 3 ソースずつ処理する"
    }
  });
}

