import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/cron";

export async function POST(request: Request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    data: {
      job: "ai",
      processed_articles: 0,
      model: process.env.OPENAI_MODEL ?? "gpt-5.5",
      note: "OpenAI 接続後に未処理 5 件を解析する"
    }
  });
}

