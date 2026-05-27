import { NextResponse } from "next/server";
import { sourceAnalyzeSchema } from "@/lib/schemas";
import { detectFeedUrl, extractConfiguredItems, extractRssItems, faviconUrl, fetchText, getSiteName, sanitizePreviewHtml, suggestSelectors } from "@/lib/content";

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
    const selectors = suggestSelectors(html);
    const preview = feedUrl ? extractRssItems(await fetchText(feedUrl), feedUrl, 5) : extractConfiguredItems(html, sourceUrl, selectors, 5);

    return NextResponse.json({
      data: {
        mode,
        sourceUrl,
        feedUrl,
        companyName: getSiteName(html, sourceUrl),
        companyLogoUrl: faviconUrl(sourceUrl),
        selectors,
        previewHtml: sanitizePreviewHtml(html),
        confidence: preview.length > 0 ? 0.82 : 0.48,
        notes: feedUrl
          ? "RSS/Atom フィードを検出しました。フィード URL を監視対象として保存できます。"
          : "RSS/Atom は検出されませんでした。画面上の要素をクリックしてスクレイピング設定を確認してください。",
        preview
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Analyze failed" }, { status: 500 });
  }
}
