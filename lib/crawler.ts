import { getServiceSupabase } from "@/lib/supabase";
import { searchPressReleaseUrls, summarizePressReleaseUrl } from "@/lib/openai";
import type { ArticleSummaryOutput, PreviewArticle } from "@/lib/schemas";
import type { Source } from "@/lib/types";

export function buildPressReleaseDiscoveryPrompt(source: Pick<Source, "name" | "url">, count: number) {
  const sourceUrl = new URL(source.url);

  return [
    `${source.name} の最新プレスリリース個別URLを新しい順に最大 ${count} 件取得してください。`,
    "以下の手順を順番に実行してください。前の手順で指定件数を取得できた場合は、後続手順は実行しなくて構いません。",
    `1. ${source.url} を調べ、ページ本文の主コンテンツ領域にある記事一覧、リスト、カードから最新のプレスリリースを取得する`,
    `2. 指定した数のプレスリリースを取得できなければ、${source.url} のドメイン（${sourceUrl.hostname}）内でWeb検索して最新のプレスリリースを取得する`,
    `3. それでも指定した数のプレスリリースを取得できなければ、「${source.name} プレスリリース」でWeb検索を行い、最新のプレスリリースを取得する`,
    "ヘッダー、グローバルナビ、フッター、サイドバー、関連記事、別カテゴリのニュースリンクにあるURLは除外してください。",
    "成果物はプレスリリース本文の個別URLだけにしてください。一覧ページ、カテゴリページ、採用情報、問い合わせ、SNS、重複URLは除外してください。",
    "指定件数に満たない場合でも、取得できた個別URLだけを返してください。"
  ].join("\n");
}

async function discoverPressReleaseUrlsWithAi(
  source: Pick<Source, "name" | "url">,
  count: number,
  sourceId?: string
) {
  const result = await searchPressReleaseUrls(buildPressReleaseDiscoveryPrompt(source, count), "crawl_step_a");
  if (sourceId) await logUsage({ purpose: result.purpose, sourceId, usage: result.usage });
  return [...new Set(result.urls)].slice(0, count);
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
  sourceId?: string,
  count = 20
): Promise<string[]> {
  return discoverPressReleaseUrlsWithAi(source, count, sourceId);
}

export async function summarizeUrlsForPreview(
  source: Pick<Source, "name" | "url">,
  count: number
): Promise<{ articles: PreviewArticle[]; discovered: number; rejected: number }> {
  const links = await discoverPressReleaseUrlsWithAi(source, count);
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

  return { articles, discovered: links.length, rejected };
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
  const links = await discoverPressReleaseUrls(source, source.id, 20);
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
