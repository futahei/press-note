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
export const HOME_ARTICLE_WINDOW_DAYS = 7;

const initialPrefixGroups: Record<string, string[]> = {
  あ: ["あ", "い", "う", "え", "お", "ア", "イ", "ウ", "エ", "オ"],
  か: ["か", "き", "く", "け", "こ", "が", "ぎ", "ぐ", "げ", "ご", "カ", "キ", "ク", "ケ", "コ", "ガ", "ギ", "グ", "ゲ", "ゴ"],
  さ: ["さ", "し", "す", "せ", "そ", "ざ", "じ", "ず", "ぜ", "ぞ", "サ", "シ", "ス", "セ", "ソ", "ザ", "ジ", "ズ", "ゼ", "ゾ"],
  た: ["た", "ち", "つ", "て", "と", "だ", "ぢ", "づ", "で", "ど", "タ", "チ", "ツ", "テ", "ト", "ダ", "ヂ", "ヅ", "デ", "ド"],
  な: ["な", "に", "ぬ", "ね", "の", "ナ", "ニ", "ヌ", "ネ", "ノ"],
  は: ["は", "ひ", "ふ", "へ", "ほ", "ば", "び", "ぶ", "べ", "ぼ", "ぱ", "ぴ", "ぷ", "ぺ", "ぽ", "ハ", "ヒ", "フ", "ヘ", "ホ", "バ", "ビ", "ブ", "ベ", "ボ", "パ", "ピ", "プ", "ペ", "ポ"],
  ま: ["ま", "み", "む", "め", "も", "マ", "ミ", "ム", "メ", "モ"],
  や: ["や", "ゆ", "よ", "ヤ", "ユ", "ヨ"],
  ら: ["ら", "り", "る", "れ", "ろ", "ラ", "リ", "ル", "レ", "ロ"],
  わ: ["わ", "を", "ん", "ワ", "ヲ", "ン"]
};

function initialPrefixes(initial?: string) {
  if (!initial) return [];
  return initialPrefixGroups[initial] ?? [initial];
}

function matchesInitial(reading: string, initial?: string) {
  const prefixes = initialPrefixes(initial);
  return prefixes.length === 0 || prefixes.some((prefix) => reading.startsWith(prefix));
}

function applyInitialFilter<T>(request: T, initial?: string): T {
  const prefixes = initialPrefixes(initial);
  if (prefixes.length === 0) return request;
  const expression = prefixes.map((prefix) => `reading.ilike.${prefix}%`).join(",");
  return (request as { or: (expression: string) => T }).or(expression);
}

function orderByArticleDate(articles: Article[]) {
  return [...articles].sort((a, b) => {
    const aDate = new Date(a.published_at ?? a.fetched_at).getTime();
    const bDate = new Date(b.published_at ?? b.fetched_at).getTime();
    return bDate - aDate;
  });
}

function isArticleWithinHomeWindow(article: Article, now = new Date()) {
  const articleDate = new Date(article.published_at ?? article.fetched_at).getTime();
  return articleDate >= now.getTime() - HOME_ARTICLE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

function jstDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("ja-JP-u-ca-gregory", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function selectWordOfDayIndex(date: Date, total: number) {
  if (total <= 0) return -1;
  const key = jstDateKey(date);
  let hash = 0;
  for (const character of key) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash % total;
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

export async function listHomeArticles(): Promise<{ articles: Article[]; hasRecentArticles: boolean }> {
  const supabase = getOptionalServiceSupabase();
  const cutoff = new Date(Date.now() - HOME_ARTICLE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  if (!supabase) {
    const rows = orderByArticleDate(fixtureArticles.filter((article) => !article.is_deleted));
    const recent = rows.filter((article) => isArticleWithinHomeWindow(article));
    return {
      articles: recent,
      hasRecentArticles: recent.length > 0
    };
  }

  const recentResult = await supabase
    .from("articles")
    .select("*, source:sources(id,name,url)")
    .eq("is_deleted", false)
    .or(`published_at.gte.${cutoff},and(published_at.is.null,fetched_at.gte.${cutoff})`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("fetched_at", { ascending: false });

  if (recentResult.error?.code === "PGRST205") {
    const rows = orderByArticleDate(fixtureArticles.filter((article) => !article.is_deleted));
    const recent = rows.filter((article) => isArticleWithinHomeWindow(article));
    return {
      articles: recent,
      hasRecentArticles: recent.length > 0
    };
  }
  if (recentResult.error) throw recentResult.error;

  return {
    articles: (recentResult.data ?? []) as Article[],
    hasRecentArticles: (recentResult.data ?? []).length > 0
  };
}

export async function countEnabledSources(): Promise<number> {
  const supabase = getOptionalServiceSupabase();
  if (!supabase) return fixtureSources.filter((source) => source.enabled).length;

  const { count, error } = await supabase.from("sources").select("id", { count: "exact", head: true }).eq("enabled", true);
  if (error?.code === "PGRST205") return fixtureSources.filter((source) => source.enabled).length;
  if (error) throw error;
  return count ?? 0;
}

export async function getWordOfDay(date = new Date()): Promise<(Term & { article_count: number }) | null> {
  const supabase = getOptionalServiceSupabase();

  if (!supabase) {
    const terms = [...fixtureTerms].sort((a, b) => a.id.localeCompare(b.id));
    const index = selectWordOfDayIndex(date, terms.length);
    const term = index >= 0 ? terms[index] : null;
    return term ? { ...term, article_count: term.article_count ?? 0 } : null;
  }

  const countResult = await supabase.from("terms").select("id", { count: "exact", head: true });
  if (countResult.error?.code === "PGRST205") {
    const terms = [...fixtureTerms].sort((a, b) => a.id.localeCompare(b.id));
    const index = selectWordOfDayIndex(date, terms.length);
    const term = index >= 0 ? terms[index] : null;
    return term ? { ...term, article_count: term.article_count ?? 0 } : null;
  }
  if (countResult.error) throw countResult.error;

  const total = countResult.count ?? 0;
  const index = selectWordOfDayIndex(date, total);
  if (index < 0) return null;

  const { data, error } = await supabase
    .from("terms")
    .select("*, article_terms(article_id)")
    .order("id", { ascending: true })
    .range(index, index)
    .maybeSingle();

  if (error?.code === "PGRST205") {
    const terms = [...fixtureTerms].sort((a, b) => a.id.localeCompare(b.id));
    const fallbackIndex = selectWordOfDayIndex(date, terms.length);
    const term = fallbackIndex >= 0 ? terms[fallbackIndex] : null;
    return term ? { ...term, article_count: term.article_count ?? 0 } : null;
  }
  if (error) throw error;
  if (!data) return null;

  const row = data as Term & { article_terms?: Array<{ article_id: string }> };
  const { article_terms: articleTerms, ...term } = row;
  return { ...term, article_count: articleTerms?.length ?? 0 };
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
      if (!matchesInitial(term.reading, query.initial)) return false;
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
  request = applyInitialFilter(request, query.initial);
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
    fallback = applyInitialFilter(fallback, query.initial);
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
        if (!matchesInitial(term.reading, query.initial)) return false;
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

export async function listOpenBugReports(kind: "all" | "bug" | "feature" = "all"): Promise<BugReport[]> {
  const supabase = getOptionalServiceSupabase();
  if (!supabase) return kind === "all" ? fixtureBugReports : fixtureBugReports.filter((report) => report.kind === kind);

  let request = supabase
    .from("bug_reports")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (kind !== "all") request = request.eq("kind", kind);

  const { data, error } = await request;
  if (error?.code === "PGRST205") return fixtureBugReports;
  if (error) throw error;
  return (data ?? []).map((report) => ({ kind: "bug", ...report })) as BugReport[];
}

export async function listUsageDaily(): Promise<UsageDaily[]> {
  const supabase = getOptionalServiceSupabase();
  if (!supabase) return fixtureUsage;

  const { data, error } = await supabase
    .from("llm_usage_daily")
    .select("*")
    .order("usage_date", { ascending: false })
    .limit(120);
  if (error?.code === "PGRST205") return fixtureUsage;
  if (error) throw error;
  return ((data ?? []) as UsageDaily[]).sort((a, b) => a.usage_date.localeCompare(b.usage_date));
}
