import * as cheerio from "cheerio";
import { getServiceSupabase } from "@/lib/supabase";
import { searchPressReleaseUrls, summarizePressReleaseUrl } from "@/lib/openai";
import type { ArticleSummaryOutput, PreviewArticle } from "@/lib/schemas";
import type { Source } from "@/lib/types";

export async function discoverLinksFromListing(listingUrl: string): Promise<string[]> {
  const response = await fetch(listingUrl, {
    headers: {
      "user-agent": "PressNote/0.1 (+https://pressnote.example)"
    },
    next: { revalidate: 0 }
  });
  if (!response.ok) return [];

  const html = await response.text();
  const $ = cheerio.load(html);
  const base = new URL(listingUrl);
  const seen = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    try {
      const url = new URL(href, base);
      if (url.origin === base.origin) seen.add(url.toString());
    } catch {
      // Ignore invalid href values from source pages.
    }
  });

  return [...seen].slice(0, 20);
}

async function logUsage({
  purpose,
  sourceId,
  articleId,
  usage
}: {
  purpose: string;
  sourceId?: string;
  articleId?: string;
  usage: { input_tokens: number; output_tokens: number; cost_usd: number };
}) {
  const supabase = getServiceSupabase();
  await supabase.from("llm_usage_logs").insert({
    model: process.env.OPENAI_MODEL ?? "gpt-5.5",
    purpose,
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    cost_usd: usage.cost_usd,
    source_id: sourceId,
    article_id: articleId
  });
}

export async function discoverPressReleaseUrls(
  source: Pick<Source, "name" | "url">,
  sourceId?: string
): Promise<string[]> {
  const directLinks = await discoverLinksFromListing(source.url);
  if (directLinks.length > 0) return directLinks.slice(0, 20);

  const sourceUrl = new URL(source.url);
  const official = await searchPressReleaseUrls(
    `site:${sourceUrl.hostname} に絞って、本日公開された ${source.name} の公式プレスリリース個別URLを最大20件抽出してください。一覧ページは除外してください。`,
    "crawl_step_b"
  );
  if (sourceId) await logUsage({ purpose: official.purpose, sourceId, usage: official.usage });
  if (official.urls.length > 0) return official.urls.slice(0, 20);

  const broad = await searchPressReleaseUrls(
    `"${source.name}" プレスリリース 公式 今日 で検索し、本日公開された公式プレスリリース個別URLを最大20件抽出してください。`,
    "crawl_step_c"
  );
  if (sourceId) await logUsage({ purpose: broad.purpose, sourceId, usage: broad.usage });
  return broad.urls.slice(0, 20);
}

export async function summarizeUrlsForPreview(
  source: Pick<Source, "name" | "url">,
  count: number
): Promise<{ articles: PreviewArticle[]; discovered: number }> {
  const links = await discoverPressReleaseUrls(source);
  const articles: PreviewArticle[] = [];

  for (const url of links.slice(0, count)) {
    const summary = await summarizePressReleaseUrl(url);
    if (summary.is_press_release) {
      articles.push({ ...summary, url });
    }
  }

  return { articles, discovered: links.length };
}

export async function saveSummarizedArticle({
  sourceId,
  url,
  summary
}: {
  sourceId: string;
  url: string;
  summary: ArticleSummaryOutput & { usage?: { input_tokens: number; output_tokens: number; cost_usd: number } };
}) {
  const supabase = getServiceSupabase();
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .upsert(
      {
        source_id: sourceId,
        url,
        title: summary.title,
        summary: summary.summary,
        published_at: summary.published_at
      },
      { onConflict: "url", ignoreDuplicates: true }
    )
    .select("id")
    .single();
  if (articleError) throw articleError;

  for (const term of summary.terms) {
    const { data: existingTerm, error: existingError } = await supabase
      .from("terms")
      .select("id")
      .eq("headword", term.headword)
      .maybeSingle();
    if (existingError) throw existingError;

    const { data: upserted, error: termError } = existingTerm
      ? { data: existingTerm, error: null }
      : await supabase
          .from("terms")
          .insert({ ...term, source_kind: "ai", status: "published" })
          .select("id")
          .single();
    if (termError) throw termError;
    await supabase.from("article_terms").upsert({ article_id: article.id, term_id: upserted.id });
  }

  return article.id as string;
}

export async function crawlSource(source: Pick<Source, "id" | "name" | "url">) {
  const supabase = getServiceSupabase();
  const links = await discoverPressReleaseUrls(source);
  const processed: string[] = [];
  const skipped: string[] = [];

  for (const url of links.slice(0, 20)) {
    const { data: existing, error: existingError } = await supabase
      .from("articles")
      .select("id")
      .eq("url", url)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      skipped.push(url);
      continue;
    }

    const { data: rejected, error: rejectedError } = await supabase
      .from("rejected_article_urls")
      .select("url")
      .eq("url", url)
      .maybeSingle();
    if (rejectedError) throw rejectedError;
    if (rejected) {
      skipped.push(url);
      continue;
    }

    const summary = await summarizePressReleaseUrl(url);
    if (!summary.is_press_release) {
      skipped.push(url);
      continue;
    }

    const articleId = await saveSummarizedArticle({ sourceId: source.id, url, summary });
    await logUsage({ purpose: "summarize", sourceId: source.id, articleId, usage: summary.usage });

    processed.push(url);
  }

  await supabase.from("sources").update({ last_crawled_at: new Date().toISOString() }).eq("id", source.id);
  return { processed, skipped, discovered: links.length };
}
