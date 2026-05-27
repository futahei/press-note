import { NextResponse } from "next/server";
import { z } from "zod";
import { extractConfiguredItems, extractRssItems, fetchText, type SourceSelectors } from "@/lib/content";

const previewSchema = z.object({
  url: z.string().url(),
  mode: z.enum(["rss", "scrape", "pdf_link"]).default("scrape"),
  selectors: z.unknown().optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = previewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const html = await fetchText(parsed.data.url);
    const preview =
      parsed.data.mode === "rss"
        ? extractRssItems(html, parsed.data.url, 20)
        : extractConfiguredItems(html, parsed.data.url, parsed.data.selectors as SourceSelectors | undefined, 20);

    return NextResponse.json({ data: { preview } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Preview failed" }, { status: 500 });
  }
}
