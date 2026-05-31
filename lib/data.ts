import { articleQuerySchema, termQuerySchema } from "@/lib/schemas";
import { getOptionalServiceSupabase } from "@/lib/supabase";
import type { Article, BugReport, Report, Source, Term, UsageDaily } from "@/lib/types";
import {
  fixtureArticles,
  fixtureBugReports,
  fixtureReports,
  fixtureSources,
  fixtureTerms,
  fixtureUsage
} from "@/lib/fixtures";

export const ARTICLES_PER_PAGE = 18;
export const TERMS_PER_PAGE = 24;

function orderByArticleDate(articles: Article[]) {
  return [...articles].sort((a, b) => {
    const aDate = new Date(a.published_at ?? a.fetched_at).getTime();
    const bDate = new Date(b.published_at ?? b.fetched_at).getTime();
    return bDate - aDate;
  });
}

function totalFromRangeError(error: { details?: string | null } | null | undefined, fallback: number) {
  const match = error?.details?.match(/only\s+(\d+)\s+rows/i);
  return match ? Number(match[1]) : fallback;
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
    if (query.from) rows = rows.filter((article) => (article.published_at ?? article.fetched_at) >= `${query.from}T00:00:00.000Z`);
    if (query.to) rows = rows.filter((article) => (article.published_at ?? article.fetched_at) <= `${query.to}T23:59:59.999Z`);
    const start = (query.page - 1) * query.limit;
    return {
      articles: rows.slice(start, start + query.limit),
      total: rows.length,
      page: query.page,
      limit: query.limit,
      hasMore: start + query.limit < rows.length
    };
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

  const from = (query.page - 1) * query.limit;
  const to = from + query.limit - 1;
  const { data, count, error } = await request.range(from, to);
  if (error?.code === "PGRST103") {
    return {
      articles: [],
      total: totalFromRangeError(error, from),
      page: query.page,
      limit: query.limit,
      hasMore: false
    };
  }
  if (error?.code === "PGRST205") {
    const fallback = orderByArticleDate(fixtureArticles);
    return {
      articles: fallback.slice(from, from + query.limit),
      total: fallback.length,
      page: query.page,
      limit: query.limit,
      hasMore: from + query.limit < fallback.length
    };
  }
  if (error) throw error;

  return {
    articles: (data ?? []) as Article[],
    total: count ?? 0,
    page: query.page,
    limit: query.limit,
    hasMore: from + query.limit < (count ?? 0)
  };
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

export async function listTermsPage(searchParams: unknown = {}) {
  const query = termQuerySchema.parse(searchParams);
  const supabase = getOptionalServiceSupabase();
  const from = (query.page - 1) * query.limit;
  const to = from + query.limit - 1;

  if (!supabase) {
    const rows = fixtureTerms.filter((term) => {
      if (query.initial && !term.reading.startsWith(query.initial)) return false;
      if (query.q && !(term.headword.startsWith(query.q) || term.reading.startsWith(query.q))) return false;
      return true;
    });
    return {
      terms: rows.slice(from, from + query.limit),
      total: rows.length,
      page: query.page,
      limit: query.limit,
      hasMore: from + query.limit < rows.length
    };
  }

  let request = supabase
    .from("terms_with_article_count")
    .select("*", { count: "exact" })
    .order("reading", { ascending: true });
  if (query.initial) request = request.ilike("reading", `${query.initial}%`);
  if (query.q) request = request.or(`headword.ilike.${query.q}%,reading.ilike.${query.q}%`);
  let { data, count, error } = await request.range(from, to);
  if (error?.code === "PGRST103") {
    return {
      terms: [],
      total: totalFromRangeError(error, from),
      page: query.page,
      limit: query.limit,
      hasMore: false
    };
  }
  if (error?.code === "PGRST205") {
    let fallback = supabase.from("terms").select("*", { count: "exact" }).order("reading", { ascending: true });
    if (query.initial) fallback = fallback.ilike("reading", `${query.initial}%`);
    if (query.q) fallback = fallback.or(`headword.ilike.${query.q}%,reading.ilike.${query.q}%`);
    const fallbackResult = await fallback.range(from, to);
    data = fallbackResult.data;
    count = fallbackResult.count;
    error = fallbackResult.error;
    if (error?.code === "PGRST103") {
      return {
        terms: [],
        total: totalFromRangeError(error, from),
        page: query.page,
        limit: query.limit,
        hasMore: false
      };
    }
    if (error?.code === "PGRST205") {
      const rows = fixtureTerms.filter((term) => {
        if (query.initial && !term.reading.startsWith(query.initial)) return false;
        if (query.q && !(term.headword.startsWith(query.q) || term.reading.startsWith(query.q))) return false;
        return true;
      });
      return {
        terms: rows.slice(from, from + query.limit),
        total: rows.length,
        page: query.page,
        limit: query.limit,
        hasMore: from + query.limit < rows.length
      };
    }
  }
  if (error) throw error;
  return {
    terms: (data ?? []) as Term[],
    total: count ?? 0,
    page: query.page,
    limit: query.limit,
    hasMore: from + query.limit < (count ?? 0)
  };
}

export async function listTerms(searchParams: unknown = {}): Promise<Term[]> {
  return (await listTermsPage({ ...(typeof searchParams === "object" && searchParams ? searchParams : {}), limit: 500 })).terms;
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
      openBugReportCount: fixtureBugReports.length,
      termCount: fixtureTerms.length
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [sources, articles, reports, bugReports, terms] = await Promise.all([
    supabase.from("sources").select("id", { count: "exact", head: true }).eq("enabled", true),
    supabase.from("articles").select("id", { count: "exact", head: true }).gte("fetched_at", today.toISOString()),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("bug_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("terms").select("id", { count: "exact", head: true })
  ]);

  for (const result of [sources, articles, reports, bugReports, terms]) {
    if (result.error?.code === "PGRST205") {
      return {
        sourceCount: fixtureSources.length,
        todayArticleCount: fixtureArticles.length,
        openReportCount: fixtureReports.length,
        openBugReportCount: fixtureBugReports.length,
        termCount: fixtureTerms.length
      };
    }
    if (result.error) throw result.error;
  }

  return {
    sourceCount: sources.count ?? 0,
    todayArticleCount: articles.count ?? 0,
    openReportCount: reports.count ?? 0,
    openBugReportCount: bugReports.count ?? 0,
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

export async function listOpenBugReports(): Promise<BugReport[]> {
  const supabase = getOptionalServiceSupabase();
  if (!supabase) return fixtureBugReports;

  const { data, error } = await supabase
    .from("bug_reports")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error?.code === "PGRST205") return fixtureBugReports;
  if (error) throw error;
  return (data ?? []) as BugReport[];
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
