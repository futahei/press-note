import { getSupabaseAdminClient, getSupabaseClient } from "./supabase";
import type { Article, Company, FetchMode, Source, SourceHealth, Term } from "./types";

type RawCompany = {
  id: string;
  name: string;
  logo_url: string | null;
  description?: string | null;
};

type RawSource = {
  id: string;
  company_id: string;
  url: string;
  mode: FetchMode;
  health: SourceHealth;
  enabled: boolean;
  last_crawled_at: string | null;
  companies?: RawCompany | RawCompany[] | null;
};

type RawWord = {
  id?: string;
  word: string;
  reading: string | null;
  meaning: string;
  tags: string[] | null;
  deleted_at?: string | null;
  created_at?: string | null;
};

type RawArticleWord = {
  created_at?: string | null;
  words?: RawWord | RawWord[] | null;
  articles?: RawRelatedArticle | RawRelatedArticle[] | null;
};

type RawArticle = {
  id: string;
  company_id: string;
  source_item_id: string;
  title: string;
  source_url: string;
  pdf_url: string | null;
  published_at: string | null;
  detected_at: string;
  summary_short: string | null;
  summary_long: string | null;
  tags: string[] | null;
  ai_processed_at: string | null;
  companies?: RawCompany | RawCompany[] | null;
  sources?: Pick<RawSource, "mode"> | Array<Pick<RawSource, "mode">> | null;
  article_words?: RawArticleWord[] | null;
};

type RawRelatedArticle = {
  id: string;
  title: string;
  published_at: string | null;
  detected_at: string;
  tags: string[] | null;
  companies?: Pick<RawCompany, "name"> | Array<Pick<RawCompany, "name">> | null;
};

type RawTermEntry = RawWord & {
  article_words?: RawArticleWord[] | null;
};

export type TermEntry = Term & {
  count: number;
  articles: Array<{
    id: string;
    title: string;
    companyName: string;
    tags: string[];
    date: string;
  }>;
};

const ALL_TAG_LABEL = "\u3059\u3079\u3066";
const PUBLISHED_LABEL = "\u516c\u958b";
const DETECTED_LABEL = "\u691c\u77e5";

const articleSelect = `
  id,
  company_id,
  source_item_id,
  title,
  source_url,
  pdf_url,
  published_at,
  detected_at,
  summary_short,
  summary_long,
  tags,
  ai_processed_at,
  companies(id, name, logo_url, description),
  sources(mode),
  article_words(created_at, words(id, word, reading, meaning, tags, deleted_at))
`;

function first<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

function mapCompany(raw?: RawCompany | null): Company {
  return {
    id: raw?.id ?? "",
    name: raw?.name ?? "Unknown",
    logoUrl: raw?.logo_url || "/icon.png",
    description: raw?.description ?? undefined
  };
}

function mapTerm(raw: RawWord): Term | null {
  if (raw.deleted_at) {
    return null;
  }
  return {
    word: raw.word,
    reading: raw.reading ?? undefined,
    meaning: raw.meaning,
    tags: raw.tags ?? []
  };
}

function mapArticle(raw: RawArticle): Article {
  const company = mapCompany(first(raw.companies));
  const source = first(raw.sources);
  const words = (raw.article_words ?? [])
    .map((relation) => first(relation.words))
    .filter((word): word is RawWord => Boolean(word))
    .map(mapTerm)
    .filter((term): term is Term => Boolean(term));

  return {
    id: raw.id,
    companyId: raw.company_id,
    company,
    title: raw.title,
    summaryShort: raw.summary_short ?? "",
    summaryLong: raw.summary_long ?? "",
    words,
    tags: raw.tags ?? [],
    sourceUrl: raw.source_url,
    pdfUrl: raw.pdf_url ?? undefined,
    publishedAt: raw.published_at ?? undefined,
    detectedAt: raw.detected_at,
    fetchMode: source?.mode ?? "rss",
    sourceItemId: raw.source_item_id,
    aiProcessedAt: raw.ai_processed_at ?? undefined
  };
}

function mapSource(raw: RawSource, sevenDayCount = 0, failureCount = 0): Source {
  const company = mapCompany(first(raw.companies));
  return {
    id: raw.id,
    companyId: raw.company_id,
    companyName: company.name,
    url: raw.url,
    mode: raw.mode,
    health: raw.health,
    enabled: raw.enabled,
    lastCrawledAt: raw.last_crawled_at ?? undefined,
    sevenDayCount,
    failureCount
  };
}

function latestFirst(a: { date: string }, b: { date: string }) {
  return b.date.localeCompare(a.date);
}

export async function getCompany(companyId: string): Promise<Company | undefined> {
  const client = getSupabaseClient();
  if (!client) {
    return undefined;
  }

  const { data, error } = await client
    .from("companies")
    .select("id, name, logo_url, description")
    .eq("id", companyId)
    .maybeSingle();

  if (error || !data) {
    return undefined;
  }
  return mapCompany(data as RawCompany);
}

export async function getCompanies(): Promise<Company[]> {
  const client = getSupabaseClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client.from("companies").select("id, name, logo_url, description").order("name");
  if (error || !data) {
    return [];
  }
  return (data as RawCompany[]).map(mapCompany);
}

export async function getArticle(articleId: string): Promise<Article | undefined> {
  const client = getSupabaseClient();
  if (!client) {
    return undefined;
  }

  const { data, error } = await client
    .from("articles")
    .select(articleSelect)
    .eq("id", articleId)
    .is("hidden_at", null)
    .maybeSingle();

  if (error || !data) {
    return undefined;
  }
  return mapArticle(data as unknown as RawArticle);
}

export async function getArticles(params?: { q?: string | null; tag?: string | null; sort?: string | null }): Promise<Article[]> {
  const client = getSupabaseClient();
  if (!client) {
    return [];
  }

  const q = params?.q?.trim().toLowerCase();
  const tag = params?.tag?.trim();
  const sort = params?.sort ?? "latest";
  let query = client.from("articles").select(articleSelect).is("hidden_at", null).limit(50);

  if (tag && tag !== ALL_TAG_LABEL) {
    query = query.contains("tags", [tag]);
  }

  const { data, error } = await query.order("detected_at", { ascending: false });
  if (error || !data) {
    return [];
  }

  const articles = (data as unknown as RawArticle[]).map(mapArticle);
  const filtered = q
    ? articles.filter((article) =>
        [article.title, article.summaryShort, article.company.name, ...article.tags].join(" ").toLowerCase().includes(q)
      )
    : articles;

  if (sort === "company") {
    return filtered.sort((a, b) => a.company.name.localeCompare(b.company.name, "ja"));
  }

  return filtered.sort((a, b) => getComparableDate(b).localeCompare(getComparableDate(a)));
}

export async function getSources(): Promise<Source[]> {
  const client = getSupabaseClient();
  if (!client) {
    return [];
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const readClient = getSupabaseAdminClient() ?? client;
  const [sourceResult, articleResult, logResult] = await Promise.all([
    readClient
      .from("sources")
      .select("id, company_id, url, mode, health, enabled, last_crawled_at, companies(id, name, logo_url, description)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    readClient.from("articles").select("source_id").gte("detected_at", sevenDaysAgo).is("hidden_at", null),
    readClient.from("crawl_logs").select("source_id").eq("status", "error").gte("started_at", sevenDaysAgo)
  ]);

  if (sourceResult.error || !sourceResult.data) {
    return [];
  }

  const articleCounts = new Map<string, number>();
  for (const article of (articleResult.data ?? []) as Array<{ source_id: string | null }>) {
    if (article.source_id) {
      articleCounts.set(article.source_id, (articleCounts.get(article.source_id) ?? 0) + 1);
    }
  }

  const failureCounts = new Map<string, number>();
  for (const log of (logResult.data ?? []) as Array<{ source_id: string | null }>) {
    if (log.source_id) {
      failureCounts.set(log.source_id, (failureCounts.get(log.source_id) ?? 0) + 1);
    }
  }

  return (sourceResult.data as unknown as RawSource[]).map((source) =>
    mapSource(source, articleCounts.get(source.id) ?? 0, failureCounts.get(source.id) ?? 0)
  );
}

export async function getFeaturedCompanies() {
  const [companies, articles] = await Promise.all([getCompanies(), getArticles()]);
  return companies
    .map((company) => ({
      company,
      count: articles.filter((article) => article.companyId === company.id).length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export async function getTopicCounts(days = 1) {
  const client = getSupabaseClient();
  if (!client) {
    return [];
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await client.from("articles").select("tags").gte("detected_at", since).is("hidden_at", null);
  if (error || !data) {
    return [];
  }

  const counts = new Map<string, number>();
  for (const article of data as Array<{ tags: string[] | null }>) {
    for (const tag of article.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getDailyTerms() {
  return (await getLatestTermEntries(5)).map((entry) => ({
    word: entry.word,
    reading: entry.reading,
    meaning: entry.meaning,
    tags: entry.tags
  }));
}

function mapRelatedArticle(raw: RawRelatedArticle) {
  return {
    id: raw.id,
    title: raw.title,
    companyName: first(raw.companies)?.name ?? "Unknown",
    tags: raw.tags ?? [],
    date: raw.published_at ?? raw.detected_at
  };
}

export async function getTermEntries(): Promise<TermEntry[]> {
  const client = getSupabaseClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("words")
    .select(
      `
        id,
        word,
        reading,
        meaning,
        tags,
        deleted_at,
        created_at,
        article_words(created_at, articles(id, title, published_at, detected_at, tags, companies(name)))
      `
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as unknown as RawTermEntry[])
    .map((word) => {
      const articles = (word.article_words ?? [])
        .map((relation) => first(relation.articles))
        .filter((article): article is RawRelatedArticle => Boolean(article))
        .map(mapRelatedArticle)
        .sort(latestFirst);

      return {
        word: word.word,
        reading: word.reading ?? undefined,
        meaning: word.meaning,
        tags: word.tags ?? [],
        count: articles.length,
        articles: articles.slice(0, 3)
      };
    })
    .sort((a, b) => {
      const latest = (b.articles[0]?.date ?? "").localeCompare(a.articles[0]?.date ?? "");
      return latest || b.count - a.count || a.word.localeCompare(b.word, "ja");
    });
}

export async function getLatestTermEntries(limit = 3): Promise<TermEntry[]> {
  return (await getTermEntries()).slice(0, limit);
}

export function getComparableDate(article: Article) {
  return article.publishedAt ?? article.detectedAt;
}

export function getDisplayDate(article: Article) {
  const source = article.publishedAt ?? article.detectedAt;
  const date = new Date(source);
  const label = article.publishedAt ? PUBLISHED_LABEL : DETECTED_LABEL;
  const formatted = new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
  return `${label} ${formatted}`;
}
