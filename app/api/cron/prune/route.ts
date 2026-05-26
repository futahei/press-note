import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/cron";

export async function POST(request: Request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    data: {
      job: "prune",
      deleted_crawl_logs: 0,
      deleted_login_attempts: 0
    }
  });
}

