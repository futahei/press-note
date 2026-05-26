import { NextResponse } from "next/server";
import { sourceAnalyzeSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = sourceAnalyzeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const url = new URL(parsed.data.url);
  return NextResponse.json({
    data: {
      mode: "rss",
      feed_url: `${url.origin}/feed.xml`,
      selectors: {
        item: "article",
        title: "h1, h2",
        url: "a",
        published_at: "time",
        body: "main",
        pdf_link: "a[href$='.pdf']"
      },
      confidence: 0.62,
      notes: "初期実装では実際の HTML 取得と OpenAI 解析は未接続です。候補を確認してから保存してください。"
    }
  });
}

