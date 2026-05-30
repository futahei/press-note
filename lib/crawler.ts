import * as cheerio from "cheerio";
import { getServiceSupabase } from "@/lib/supabase";
import { searchPressReleaseUrls, summarizePressReleaseUrl } from "@/lib/openai";
import type { ArticleSummaryOutput, PreviewArticle } from "@/lib/schemas";
import type { Source } from "@/lib/types";

type LinkCandidate = {
  url: string;
  text: string;
};

const blockedPathPatterns = [
  /\/(?:contact|inquiry|privacy|terms|sitemap|search|login|signup|recruit|career|careers)(?:\/|$)/i,
  /\/(?:rss|feed)(?:\/|$)/i,
  /\/(?:tag|tags|category|categories)(?:\/|$)/i
];

const blockedFilePattern = /\.(?:jpe?g|png|gif|svg|webp|ico|css|js|zip|mp4|mp3|woff2?|ttf)(?:$|\?)/i;

function scorePressReleaseLink(candidate: LinkCandidate): number {
  const url = new URL(candidate.url);
  const path = decodeURIComponent(url.pathname);
  const text = candidate.text.replace(/\s+/g, " ").trim();
  const haystack = `${path} ${url.search} ${text}`.toLowerCase();
  let score = 0;

  if (blockedFilePattern.test(url.pathname) || blockedPathPatterns.some((pattern) => pattern.test(url.pathname))) {
    return -1;
  }

  if (/プレスリリース|ニュースリリース|press release|news release/.test(haystack)) score += 6;
  if (/リリース|press|release|pr\b/.test(haystack)) score += 3;
  if (/ニュース|お知らせ|発表|news|topics|notice/.test(haystack)) score += 2;
  if (/\/(?:press|release|news|topics|notice|pr|ir)(?:\/|-|_)/i.test(url.pathname)) score += 2;
  if (/\/20\d{2}[/-](?:0?[1-9]|1[0-2])(?:[/-]\d{1,2})?/i.test(url.pathname)) score += 4;
  if (/(?:^|[^\d])20\d{2}[./-]\d{1,2}[./-]\d{1,2}(?:[^\d]|$)/.test(haystack)) score += 4;
  if (/(?:^|[^\d])20\d{6}(?:[^\d]|$)/.test(haystack)) score += 3;
  if (url.pathname.split("/").filter(Boolean).length >= 3) score += 1;

  return score;
}

export function rankListingLinks(candidates: LinkCandidate[]): string[] {
  const ranked = candidates
    .map((candidate, index) => ({ ...candidate, index, score: scorePressReleaseLink(candidate) }))
    .filter((candidate) => candidate.score >= 3)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return ranked.map((candidate) => candidate.url);
}

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
  const candidates: LinkCandidate[] = [];

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    try {
      const url = new URL(href, base);
      url.hash = "";
      if (url.origin !== base.origin || seen.has(url.toString())) return;
      seen.add(url.toString());
      candidates.push({ url: url.toString(), text: $(element).text() });
    } catch {
      // Ignore invalid href values from source pages.
    }
  });

  return rankListingLinks(candidates).slice(0, 20);
}

async function searchOfficialPressReleaseUrls(source: Pick<Source, "name" | "url">, sourceId?: string) {
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

  return searchOfficialPressReleaseUrls(source, sourceId);
}

export async function summarizeUrlsForPreview(
  source: Pick<Source, "name" | "url">,
  count: number
): Promise<{ articles: PreviewArticle[]; discovered: number; rejected: number; usedFallback: boolean }> {
  const directLinks = await discoverLinksFromListing(source.url);
  const usedInitialFallback = directLinks.length === 0;
  const links = usedInitialFallback ? await searchOfficialPressReleaseUrls(source) : directLinks;
  const articles: PreviewArticle[] = [];
  let rejected = 0;

  for (const url of links.slice(0, count)) {
    const summary = await summarizePressReleaseUrl(url);
    if (summary.is_press_release) {
      articles.push({ ...summary, url });
    } else {
      rejected += 1;
    }
  }

  if (articles.length > 0 || links.length === 0 || usedInitialFallback) {
    return { articles, discovered: links.length, rejected, usedFallback: usedInitialFallback };
  }

  const fallbackLinks = (await searchOfficialPressReleaseUrls(source)).filter((url) => !links.includes(url));
  for (const url of fallbackLinks.slice(0, count)) {
    const summary = await summarizePressReleaseUrl(url);
    if (summary.is_press_release) {
      articles.push({ ...summary, url });
    } else {
      rejected += 1;
    }
  }

  return { articles, discovered: links.length + fallbackLinks.length, rejected, usedFallback: fallbackLinks.length > 0 };
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
