import { articleQuerySchema, termQuerySchema } from "@/lib/schemas";
import { getOptionalServiceSupabase } from "@/lib/supabase";
import type { Article, Report, Source, Term, UsageDaily } from "@/lib/types";
import { fixtureArticles, fixtureReports, fixtureSources, fixtureTerms, fixtureUsage } from "@/lib/fixtures";

export const ARTICLES_PER_PAGE = 30;

function orderByArticleDate(articles: Article[]) {
  return [...articles].sort((a, b) => {
    const aDate = new Date(a.published_at ?? a.fetched_at).getTime();
    const bDate = new Date(b.published_at ?? b.fetched_at).getTime();
    return bDate - aDate;
  });
}

export async function listSources(): Promise<Source[]> {
  const supabase = getOptionalServiceSupabase();
  if (!supabase) return fixtureSources;

  const { data, error } = await supabase.from("sources").select("*").order("created_at", { ascending: false });
  if (error?.code === "PGRST205") return fixtureSources;
  if (error) throw error;
  return data ?? [];
}

export async function listArticles(searchParams: unknown = {}) {
  const query = articleQuerySchema.parse(searchParams);
  const supabase = getOptionalServiceSupabase();

  if (!supabase) {
    let rows = orderByArticleDate(fixtureArticles).filter((article) => !article.is_deleted);
    if (query.q) {
      rows = rows.filter((article) => `${article.title} ${article.summary}`.includes(query.q ?? ""));
    }
    if (query.source) rows = rows.filter((article) => article.source_id === query.source);
    if (query.date) rows = rows.filter((article) => (article.published_at ?? article.fetched_at).startsWith(query.date ?? ""));
    const start = (query.page - 1) * ARTICLES_PER_PAGE;
    return { articles: rows.slice(start, start + ARTICLES_PER_PAGE), total: rows.length, page: query.page };
  }

  let request = supabase
    .from("articles")
    .select("*, source:sources(id,name,url)", { count: "exact" })
    .eq("is_deleted", false)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("fetched_at", { ascending: false });

  if (query.q) request = request.or(`title.ilike.%${query.q}%,summary.ilike.%${query.q}%`);
  if (query.source) request = request.eq("source_id", query.source);
  if (query.date) {
    request = request
      .gte("published_at", `${query.date}T00:00:00.000Z`)
      .lte("published_at", `${query.date}T23:59:59.999Z`);
  }
  if (query.from) request = request.gte("published_at", `${query.from}T00:00:00.000Z`);
  if (query.to) request = request.lte("published_at", `${query.to}T23:59:59.999Z`);

  const from = (query.page - 1) * ARTICLES_PER_PAGE;
  const to = from + ARTICLES_PER_PAGE - 1;
  const { data, count, error } = await request.range(from, to);
  if (error?.code === "PGRST205") {
    return { articles: orderByArticleDate(fixtureArticles), total: fixtureArticles.length, page: query.page };
  }
  if (error) throw error;

  return { articles: (data ?? []) as Article[], total: count ?? 0, page: query.page };
}

export async function listRecentArticles(): Promise<Article[]> {
  const supabase = getOptionalServiceSupabase();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  if (!supabase) {
    return orderByArticleDate(fixtureArticles);
  }

  const { data, error } = await supabase
    .from("articles")
    .select("*, source:sources(id,name,url)")
    .eq("is_deleted", false)
    .or(`published_at.gte.${cutoff},and(published_at.is.null,fetched_at.gte.${cutoff})`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("fetched_at", { ascending: false });

  if (error?.code === "PGRST205") return orderByArticleDate(fixtureArticles);
  if (error) throw error;
  return (data ?? []) as Article[];
}

export async function getArticle(id: string): Promise<(Article & { terms: Term[] }) | null> {
  const supabase = getOptionalServiceSupabase();
  if (!supabase) {
    const article = fixtureArticles.find((item) => item.id === id);
    return article ? { ...article, terms: fixtureTerms } : null;
  }

  const { data, error } = await supabase
    .from("articles")
    .select("*, source:sources(id,name,url), article_terms(term:terms(*))")
    .eq("id", id)
    .eq("is_deleted", false)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const terms = ((data.article_terms ?? []) as Array<{ term: Term | null }>).flatMap((item) =>
    item.term ? [item.term] : []
  );
  return { ...(data as Article), terms };
}

export async function listTerms(searchParams: unknown = {}): Promise<Term[]> {
  const query = termQuerySchema.parse(searchParams);
  const supabase = getOptionalServiceSupabase();

  if (!supabase) {
    return fixtureTerms.filter((term) => {
      if (query.initial && !term.reading.startsWith(query.initial)) return false;
      if (query.q && !(term.headword.startsWith(query.q) || term.reading.startsWith(query.q))) return false;
      return true;
    });
  }

  let request = supabase.from("terms_with_article_count").select("*").order("reading", { ascending: true });
  if (query.initial) request = request.ilike("reading", `${query.initial}%`);
  if (query.q) request = request.or(`headword.ilike.${query.q}%,reading.ilike.${query.q}%`);
  let { data, error } = await request.limit(500);
  if (error?.code === "PGRST205") {
    let fallback = supabase.from("terms").select("*").order("reading", { ascending: true });
    if (query.initial) fallback = fallback.ilike("reading", `${query.initial}%`);
    if (query.q) fallback = fallback.or(`headword.ilike.${query.q}%,reading.ilike.${query.q}%`);
    const fallbackResult = await fallback.limit(500);
    data = fallbackResult.data;
    error = fallbackResult.error;
    if (error?.code === "PGRST205") return fixtureTerms;
  }
  if (error) throw error;
  return (data ?? []) as Term[];
}

export async function getTerm(id: string): Promise<(Term & { articles: Article[] }) | null> {
  const supabase = getOptionalServiceSupabase();
  if (!supabase) {
    const term = fixtureTerms.find((item) => item.id === id);
    return term ? { ...term, articles: fixtureArticles } : null;
  }

  const { data, error } = await supabase
    .from("terms")
    .select("*, article_terms(article:articles(*, source:sources(id,name,url)))")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const articles = ((data.article_terms ?? []) as Array<{ article: Article | null }>).flatMap((item) =>
    item.article && !item.article.is_deleted ? [item.article] : []
  );
  return { ...(data as Term), articles: orderByArticleDate(articles) };
}

export async function getAdminSummary() {
  const supabase = getOptionalServiceSupabase();
  if (!supabase) {
    return {
      sourceCount: fixtureSources.length,
      todayArticleCount: fixtureArticles.length,
      openReportCount: fixtureReports.length,
      termCount: fixtureTerms.length
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [sources, articles, reports, terms] = await Promise.all([
    supabase.from("sources").select("id", { count: "exact", head: true }).eq("enabled", true),
    supabase.from("articles").select("id", { count: "exact", head: true }).gte("fetched_at", today.toISOString()),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("terms").select("id", { count: "exact", head: true })
  ]);

  for (const result of [sources, articles, reports, terms]) {
    if (result.error?.code === "PGRST205") {
      return {
        sourceCount: fixtureSources.length,
        todayArticleCount: fixtureArticles.length,
        openReportCount: fixtureReports.length,
        termCount: fixtureTerms.length
      };
    }
    if (result.error) throw result.error;
  }

  return {
    sourceCount: sources.count ?? 0,
    todayArticleCount: articles.count ?? 0,
    openReportCount: reports.count ?? 0,
    termCount: terms.count ?? 0
  };
}

export async function listOpenReports(): Promise<Report[]> {
  const supabase = getOptionalServiceSupabase();
  if (!supabase) return fixtureReports;

  const { data, error } = await supabase
    .from("reports")
    .select("*, article:articles(*, source:sources(id,name,url))")
    .eq("status", "open")
    .order("created_at", { ascending: true });
  if (error?.code === "PGRST205") return fixtureReports;
  if (error) throw error;
  return (data ?? []) as Report[];
}

export async function listUsageDaily(): Promise<UsageDaily[]> {
  const supabase = getOptionalServiceSupabase();
  if (!supabase) return fixtureUsage;

  const { data, error } = await supabase
    .from("llm_usage_daily")
    .select("*")
    .order("usage_date", { ascending: true })
    .limit(90);
  if (error?.code === "PGRST205") return fixtureUsage;
  if (error) throw error;
  return (data ?? []) as UsageDaily[];
}
