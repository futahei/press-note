import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireCronSecret } from "./cron";
import { pushSubscriptionSchema } from "./schemas";
import type { Article } from "./types";

const rawCompany = {
  id: "company-1",
  name: "Example Inc.",
  logo_url: "https://example.com/logo.png",
  description: "Example company"
};

const rawSource = {
  id: "source-1",
  company_id: "company-1",
  url: "https://example.com/news",
  mode: "rss",
  health: "ok",
  enabled: true,
  last_crawled_at: "2026-05-26T08:00:00+09:00",
  companies: [rawCompany]
};

const rawArticle = {
  id: "article-1",
  company_id: "company-1",
  source_item_id: "source-item-1",
  title: "AI platform release",
  source_url: "https://example.com/news/article-1",
  pdf_url: null,
  published_at: null,
  detected_at: "2026-05-26T09:00:00+09:00",
  summary_short: "Short summary",
  summary_long: "Long summary",
  tags: ["AI", "SaaS"],
  ai_processed_at: "2026-05-26T09:05:00+09:00",
  companies: [rawCompany],
  sources: [{ mode: "rss" }],
  article_words: [
    {
      created_at: "2026-05-26T09:05:00+09:00",
      words: {
        id: "word-1",
        word: "MLOps",
        reading: "M L Ops",
        meaning: "A practice for developing and operating ML models.",
        tags: ["AI"],
        deleted_at: null
      }
    },
    {
      created_at: "2026-05-26T09:06:00+09:00",
      words: {
          id: "word-deleted",
          word: "Deleted",
          reading: null,
          meaning: "Deleted word",
          tags: null,
          deleted_at: "2026-05-26T10:00:00+09:00"
      }
    }
  ]
};

const rawWord = {
  id: "word-1",
  word: "MLOps",
  reading: "M L Ops",
  meaning: "A practice for developing and operating ML models.",
  tags: ["AI"],
  deleted_at: null,
  created_at: "2026-05-26T09:05:00+09:00",
  article_words: [
    {
      created_at: "2026-05-26T09:05:00+09:00",
      articles: {
        id: "article-1",
        title: "AI platform release",
        published_at: null,
        detected_at: "2026-05-26T09:00:00+09:00",
        tags: ["AI"],
        companies: [{ name: "Example Inc." }]
      }
    }
  ]
};

const rawWordWithoutArticles = {
  id: "word-2",
  word: "AIOps",
  reading: null,
  meaning: "Operations with AI.",
  tags: null,
  deleted_at: null,
  created_at: "2026-05-26T09:04:00+09:00",
  article_words: []
};

class FakeQuery {
  private filters = new Map<string, unknown>();

  constructor(
    private table: string,
    private selectColumns = ""
  ) {}

  select(columns: string) {
    this.selectColumns = columns;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.set(column, value);
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.set(column, value);
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.set(column, value);
    return this;
  }

  contains(column: string, value: unknown) {
    this.filters.set(column, value);
    return this;
  }

  limit() {
    return this;
  }

  order() {
    return this;
  }

  maybeSingle() {
    const data = this.resolveData();
    return Promise.resolve({ data: Array.isArray(data) ? data[0] : data, error: null });
  }

  then<TResult1 = { data: unknown; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve({ data: this.resolveData(), error: null }).then(onfulfilled, onrejected);
  }

  private resolveData() {
    if (this.table === "companies") {
      return this.filters.has("id") ? rawCompany : [rawCompany];
    }
    if (this.table === "sources") {
      return [rawSource];
    }
    if (this.table === "crawl_logs") {
      return [{ source_id: "source-1" }];
    }
    if (this.table === "words") {
      return [rawWordWithoutArticles, rawWord];
    }
    if (this.table === "articles") {
      if (this.selectColumns.trim() === "source_id") {
        return [{ source_id: "source-1" }];
      }
      if (this.selectColumns.trim() === "tags") {
        return [{ tags: rawArticle.tags }];
      }
      return this.filters.has("id") ? rawArticle : [rawArticle];
    }
    return [];
  }
}

const fakeClient = {
  from(table: string) {
    return new FakeQuery(table);
  }
};

const errorClient = {
  from() {
    return {
      select() {
        return this;
      },
      is() {
        return this;
      },
      order() {
        return Promise.resolve({ data: null, error: { message: "failed" } });
      }
    };
  }
};

const sourceErrorClient = {
  from(table: string) {
    return {
      select() {
        return this;
      },
      is() {
        return this;
      },
      eq() {
        return this;
      },
      gte() {
        return this;
      },
      order() {
        return Promise.resolve(table === "sources" ? { data: null, error: { message: "failed" } } : { data: [], error: null });
      },
      then<TResult1 = { data: unknown[]; error: null }, TResult2 = never>(
        onfulfilled?: ((value: { data: unknown[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
      ) {
        return Promise.resolve({ data: [], error: null }).then(onfulfilled, onrejected);
      }
    };
  }
};

const topicErrorClient = {
  from() {
    return {
      select() {
        return this;
      },
      gte() {
        return this;
      },
      is() {
        return Promise.resolve({ data: null, error: { message: "failed" } });
      }
    };
  }
};

const nullDataClient = {
  from() {
    return {
      select() {
        return this;
      },
      eq() {
        return this;
      },
      is() {
        return this;
      },
      limit() {
        return this;
      },
      maybeSingle() {
        return Promise.resolve({ data: null, error: null });
      },
      order() {
        return Promise.resolve({ data: null, error: null });
      }
    };
  }
};

async function importDataWithClient(client: unknown) {
  vi.resetModules();
  vi.doMock("./supabase", () => ({
    getSupabaseClient: () => client,
    getSupabaseAdminClient: () => client
  }));
  return import("./data");
}

describe("article data helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty collections when Supabase is not configured", async () => {
    const { getArticle, getArticles, getDailyTerms, getFeaturedCompanies, getSources, getTermEntries, getTopicCounts } =
      await importDataWithClient(null);

    await expect(getArticles()).resolves.toEqual([]);
    await expect(getSources()).resolves.toEqual([]);
    await expect(getFeaturedCompanies()).resolves.toEqual([]);
    await expect(getTopicCounts(30)).resolves.toEqual([]);
    await expect(getDailyTerms()).resolves.toEqual([]);
    await expect(getTermEntries()).resolves.toEqual([]);
    await expect(getArticle("missing")).resolves.toBeUndefined();
  });

  it("maps Supabase rows into app models", async () => {
    const {
      getArticle,
      getArticles,
      getCompanies,
      getCompany,
      getComparableDate,
      getDailyTerms,
      getFeaturedCompanies,
      getSources,
      getTermEntries,
      getTopicCounts
    } = await importDataWithClient(fakeClient);

    await expect(getCompany("company-1")).resolves.toMatchObject({ name: "Example Inc." });
    await expect(getCompanies()).resolves.toHaveLength(1);

    const article = await getArticle("article-1");
    expect(article?.company.name).toBe("Example Inc.");
    expect(article?.words[0].word).toBe("MLOps");

    const articles = await getArticles({ q: "platform", tag: "AI", sort: "company" });
    expect(articles).toHaveLength(1);
    expect(articles[0].fetchMode).toBe("rss");

    await expect(getSources()).resolves.toMatchObject([{ sevenDayCount: 1, failureCount: 1 }]);
    await expect(getFeaturedCompanies()).resolves.toMatchObject([{ count: 1 }]);
    await expect(getTopicCounts(30)).resolves.toEqual(expect.arrayContaining([{ tag: "AI", count: 1 }]));
    await expect(getDailyTerms()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ word: "MLOps" })]));

    const terms = await getTermEntries();
    expect(terms[0].articles).toHaveLength(1);
    expect(terms[0].count).toBe(1);
    expect(terms[1]).toMatchObject({ word: "AIOps", count: 0, articles: [] });
    expect(getComparableDate({ ...articles[0], publishedAt: "2026-05-26T08:30:00+09:00" })).toBe("2026-05-26T08:30:00+09:00");
  });

  it("returns empty results when Supabase returns errors", async () => {
    const { getTermEntries } = await importDataWithClient(errorClient);
    await expect(getTermEntries()).resolves.toEqual([]);

    const { getSources } = await importDataWithClient(sourceErrorClient);
    await expect(getSources()).resolves.toEqual([]);

    const { getTopicCounts } = await importDataWithClient(topicErrorClient);
    await expect(getTopicCounts()).resolves.toEqual([]);

    const { getArticle, getArticles, getCompanies, getCompany } = await importDataWithClient(nullDataClient);
    await expect(getCompany("company-1")).resolves.toBeUndefined();
    await expect(getCompanies()).resolves.toEqual([]);
    await expect(getArticle("article-1")).resolves.toBeUndefined();
    await expect(getArticles()).resolves.toEqual([]);
  });

  it("uses detected_at label when published_at is missing", async () => {
    const { getDisplayDate } = await importDataWithClient(null);
    const article: Article = {
      id: "article-1",
      companyId: "company-1",
      company: {
        id: "company-1",
        name: "Example",
        logoUrl: "/icon.png"
      },
      title: "Example release",
      summaryShort: "",
      summaryLong: "",
      words: [],
      tags: [],
      sourceUrl: "https://example.com",
      detectedAt: "2026-05-26T07:20:00+09:00",
      fetchMode: "rss",
      sourceItemId: "article-1"
    };

    expect(getDisplayDate(article)).toContain("\u691c\u77e5");
  });
});

describe("push subscription schema", () => {
  it("accepts 30 minute notification times", () => {
    const result = pushSubscriptionSchema.safeParse({
      endpoint: "https://push.example.com/abc",
      keys: { p256dh: "key", auth: "auth" },
      timezone: "Asia/Tokyo",
      notify_local_time: "09:30"
    });

    expect(result.success).toBe(true);
  });

  it("rejects non 30 minute notification times", () => {
    const result = pushSubscriptionSchema.safeParse({
      endpoint: "https://push.example.com/abc",
      keys: { p256dh: "key", auth: "auth" },
      timezone: "Asia/Tokyo",
      notify_local_time: "09:15"
    });

    expect(result.success).toBe(false);
  });
});

describe("cron auth helper", () => {
  it("accepts matching cron secret", () => {
    process.env.CRON_SECRET = "secret";
    const request = new Request("https://example.com/api/cron/crawl", {
      method: "POST",
      headers: { "x-cron-secret": "secret" }
    });

    expect(requireCronSecret(request)).toBeNull();
  });

  it("rejects missing configuration", async () => {
    delete process.env.CRON_SECRET;
    const request = new Request("https://example.com/api/cron/crawl", { method: "POST" });
    const response = requireCronSecret(request);

    expect(response?.status).toBe(503);
  });

  it("rejects invalid cron secret", () => {
    process.env.CRON_SECRET = "secret";
    const request = new Request("https://example.com/api/cron/crawl", {
      method: "POST",
      headers: { "x-cron-secret": "wrong" }
    });
    const response = requireCronSecret(request);

    expect(response?.status).toBe(401);
  });
});
