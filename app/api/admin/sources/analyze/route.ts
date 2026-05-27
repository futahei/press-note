import { NextResponse } from "next/server";
import { sourceAnalyzeSchema } from "@/lib/schemas";
import { defaultSelectors, detectFeedUrl, extractPressLinks, extractRssItems, faviconUrl, fetchText, getSiteName } from "@/lib/content";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = sourceAnalyzeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const sourceUrl = parsed.data.url;
    const html = await fetchText(sourceUrl);
    const feedUrl = detectFeedUrl(html, sourceUrl);
    const mode = feedUrl ? "rss" : "scrape";
    const preview = feedUrl ? extractRssItems(await fetchText(feedUrl), feedUrl, 5) : extractPressLinks(html, sourceUrl, 5);

    return NextResponse.json({
      data: {
        mode,
        sourceUrl,
        feedUrl,
        companyName: getSiteName(html, sourceUrl),
        companyLogoUrl: faviconUrl(sourceUrl),
        selectors: defaultSelectors,
        confidence: preview.length > 0 ? 0.82 : 0.48,
        notes: feedUrl
          ? "RSS/Atomフィードを検出しました。フィードURLを監視対象として保存できます。"
          : "RSS/Atomは検出されませんでした。管理者確認済みページとして、リンク抽出によるスクレイピングで保存できます。",
        preview
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Analyze failed" }, { status: 500 });
  }
}
