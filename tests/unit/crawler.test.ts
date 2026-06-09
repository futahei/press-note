import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServiceSupabaseMock, searchPressReleaseUrlsMock, summarizePressReleaseUrlMock } = vi.hoisted(() => ({
  getServiceSupabaseMock: vi.fn(),
  searchPressReleaseUrlsMock: vi.fn(),
  summarizePressReleaseUrlMock: vi.fn()
}));

vi.mock("@/lib/supabase", () => ({
  getServiceSupabase: getServiceSupabaseMock
}));

vi.mock("@/lib/openai", () => ({
  searchPressReleaseUrls: searchPressReleaseUrlsMock,
  summarizePressReleaseUrl: summarizePressReleaseUrlMock
}));

import { buildPressReleaseDiscoveryPrompt, crawlSource, isPublishedInJstDateWindow, resummarizeArticle } from "@/lib/crawler";

function createCrawlerSupabaseMock() {
  let articleIndex = 0;
  const articleMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const rejectedMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const articleUpsert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn().mockResolvedValue({ data: { id: `article-${++articleIndex}` }, error: null })
    }))
  }));
  const sourcesEq = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn((table: string) => {
    if (table === "llm_usage_logs") {
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    }
    if (table === "articles") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: articleMaybeSingle }))
        })),
        upsert: articleUpsert
      };
    }
    if (table === "rejected_article_urls") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: rejectedMaybeSingle }))
        }))
      };
    }
    if (table === "sources") {
      return {
        update: vi.fn(() => ({ eq: sourcesEq }))
      };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return { supabase: { from }, articleUpsert };
}

describe("buildPressReleaseDiscoveryPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes the AI discovery steps and requested count for preview", () => {
    const prompt = buildPressReleaseDiscoveryPrompt(
      { name: "テスト株式会社", url: "https://example.com/news" },
      5
    );

    expect(prompt).toContain("最大 5 件");
    expect(prompt).toContain("1. https://example.com/news を調べ");
    expect(prompt).toContain("ヘッダー、グローバルナビ、フッター");
    expect(prompt).toContain("2. 指定した数のプレスリリースを取得できなければ");
    expect(prompt).toContain("3. それでも指定した数のプレスリリースを取得できなければ");
  });

  it("builds a no-minimum prompt for the cron crawl date window", () => {
    const prompt = buildPressReleaseDiscoveryPrompt(
      { name: "テスト株式会社", url: "https://example.com/news" },
      { recentDays: 2, now: new Date("2026-05-31T12:00:00+09:00") }
    );

    expect(prompt).toContain("2026-05-31");
    expect(prompt).toContain("2026-05-30");
    expect(prompt).toContain("件数の上限・下限はありません");
    expect(prompt).toContain("追加検索や再試行で無理に探しに行かず、空配列");
    expect(prompt).not.toContain("指定した数のプレスリリースを取得できなければ");
  });
});

describe("crawlSource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves only press releases published today or yesterday in JST and does not cap the result count", async () => {
    const urls = [
      "https://example.com/old",
      "https://example.com/yesterday",
      ...Array.from({ length: 21 }, (_, index) => `https://example.com/today-${index + 1}`)
    ];
    const { supabase, articleUpsert } = createCrawlerSupabaseMock();
    getServiceSupabaseMock.mockReturnValue(supabase);
    searchPressReleaseUrlsMock.mockResolvedValue({
      urls,
      usage: { input_tokens: 10, output_tokens: 5, cost_usd: 0 },
      purpose: "crawl_step_a"
    });
    summarizePressReleaseUrlMock.mockImplementation(async (url: string) => ({
      title: "プレスリリース",
      summary:
        "これはテスト用のプレスリリース要約です。本文の重要な内容を日本語で自然にまとめ、読者が概要を把握できるようにしています。",
      published_at: url.endsWith("/old")
        ? "2026-05-29T23:59:00+09:00"
        : url.endsWith("/yesterday")
          ? "2026-05-30T23:59:00+09:00"
          : "2026-05-31T00:01:00+09:00",
      is_press_release: true,
      terms: [],
      usage: { input_tokens: 10, output_tokens: 5, cost_usd: 0 }
    }));

    const result = await crawlSource(
      { id: "source-1", name: "テスト株式会社", url: "https://example.com/news" },
      new Date("2026-05-31T12:00:00+09:00")
    );

    expect(searchPressReleaseUrlsMock.mock.calls[0][0]).toContain("2026-05-31");
    expect(searchPressReleaseUrlsMock.mock.calls[0][0]).toContain("2026-05-30");
    expect(result.discovered).toBe(23);
    expect(result.processed).toHaveLength(22);
    expect(result.skipped).toEqual(["https://example.com/old"]);
    expect(summarizePressReleaseUrlMock).toHaveBeenCalledTimes(23);
    expect(articleUpsert).toHaveBeenCalledTimes(22);
  });

  it("deduplicates discovered article URLs by normalized destination before summarizing", async () => {
    const { supabase, articleUpsert } = createCrawlerSupabaseMock();
    getServiceSupabaseMock.mockReturnValue(supabase);
    searchPressReleaseUrlsMock.mockResolvedValue({
      urls: [
        "https://example.com/news/release/?utm_source=mail#main",
        "https://example.com/news/release/"
      ],
      usage: { input_tokens: 10, output_tokens: 5, cost_usd: 0 },
      purpose: "crawl_step_a"
    });
    summarizePressReleaseUrlMock.mockResolvedValue({
      title: "プレスリリース",
      summary:
        "これはテスト用のプレスリリース要約です。本文の重要な内容を日本語で自然にまとめ、読者が概要を把握できるようにしています。",
      published_at: "2026-05-31T00:01:00+09:00",
      is_press_release: true,
      terms: [],
      usage: { input_tokens: 10, output_tokens: 5, cost_usd: 0 }
    });

    const result = await crawlSource(
      { id: "source-1", name: "テスト株式会社", url: "https://example.com/news" },
      new Date("2026-05-31T12:00:00+09:00")
    );

    expect(result.discovered).toBe(1);
    expect(result.processed).toEqual(["https://example.com/news/release"]);
    expect(summarizePressReleaseUrlMock).toHaveBeenCalledTimes(1);
    expect(summarizePressReleaseUrlMock).toHaveBeenCalledWith("https://example.com/news/release");
    expect(articleUpsert).toHaveBeenCalledTimes(1);
  });
});

describe("resummarizeArticle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("summarizes the supplied URL and replaces article fields and term links", async () => {
    const articleSingle = vi.fn().mockResolvedValue({
      data: { id: "article-1", source_id: "source-1", url: "https://example.com/old" },
      error: null
    });
    const existingMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const articleUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const articleUpdate = vi.fn(() => ({ eq: articleUpdateEq }));
    const articleSelect = vi
      .fn()
      .mockReturnValueOnce({ eq: vi.fn(() => ({ single: articleSingle })) })
      .mockReturnValueOnce({ eq: vi.fn(() => ({ maybeSingle: existingMaybeSingle })) });
    const articleTermsDeleteEq = vi.fn().mockResolvedValue({ error: null });
    const articleTermsDelete = vi.fn(() => ({ eq: articleTermsDeleteEq }));
    const articleTermsUpsert = vi.fn().mockResolvedValue({ error: null });
    const termMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const termInsertSingle = vi.fn().mockResolvedValue({ data: { id: "term-1" }, error: null });
    const termInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: termInsertSingle })) }));
    const usageInsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "articles") {
        return { select: articleSelect, update: articleUpdate };
      }
      if (table === "article_terms") {
        return { delete: articleTermsDelete, upsert: articleTermsUpsert };
      }
      if (table === "terms") {
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: termMaybeSingle })) })),
          insert: termInsert
        };
      }
      if (table === "llm_usage_logs") {
        return { insert: usageInsert };
      }
      throw new Error(`Unexpected table: ${table}`);
    });
    getServiceSupabaseMock.mockReturnValue({ from });
    summarizePressReleaseUrlMock.mockResolvedValue({
      title: "更新後タイトル",
      summary:
        "更新後の要約です。対象URLの本文をもとに、発表内容の重要なポイントを自然な日本語で把握できるようにまとめています。",
      published_at: "2026-06-10T09:00:00+09:00",
      is_press_release: true,
      terms: [
        {
          headword: "系統用蓄電池",
          reading: "けいとうようちくでんち",
          description: "電力系統に接続し、需給調整や再生可能エネルギーの出力変動緩和に使う蓄電池。"
        }
      ],
      usage: { input_tokens: 10, output_tokens: 5, cost_usd: 0 }
    });

    const result = await resummarizeArticle({
      articleId: "article-1",
      url: "https://example.com/new?utm_source=mail#body"
    });

    expect(summarizePressReleaseUrlMock).toHaveBeenCalledWith("https://example.com/new");
    expect(articleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://example.com/new",
        title: "更新後タイトル",
        summary:
          "更新後の要約です。対象URLの本文をもとに、発表内容の重要なポイントを自然な日本語で把握できるようにまとめています。",
        published_at: "2026-06-10T09:00:00+09:00",
        is_deleted: false
      })
    );
    expect(articleTermsDeleteEq).toHaveBeenCalledWith("article_id", "article-1");
    expect(termInsert).toHaveBeenCalledWith({
      headword: "系統用蓄電池",
      reading: "けいとうようちくでんち",
      description: "電力系統に接続し、需給調整や再生可能エネルギーの出力変動緩和に使う蓄電池。",
      source_kind: "ai",
      status: "published"
    });
    expect(articleTermsUpsert).toHaveBeenCalledWith({ article_id: "article-1", term_id: "term-1" });
    expect(usageInsert).toHaveBeenCalledWith(expect.objectContaining({ purpose: "summarize", article_id: "article-1" }));
    expect(result.url).toBe("https://example.com/new");
  });
});

describe("isPublishedInJstDateWindow", () => {
  it("compares published_at by Japan time within the date window", () => {
    const target = new Date("2026-05-31T12:00:00+09:00");

    expect(isPublishedInJstDateWindow("2026-05-30T15:00:00.000Z", target, 2)).toBe(true);
    expect(isPublishedInJstDateWindow("2026-05-29T15:00:00.000Z", target, 2)).toBe(true);
    expect(isPublishedInJstDateWindow("2026-05-29T14:59:59.000Z", target, 2)).toBe(false);
    expect(isPublishedInJstDateWindow(null, target, 2)).toBe(false);
  });
});
