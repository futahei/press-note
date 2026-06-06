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

import { buildPressReleaseDiscoveryPrompt, crawlSource, isPublishedInJstDateWindow } from "@/lib/crawler";

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

describe("isPublishedInJstDateWindow", () => {
  it("compares published_at by Japan time within the date window", () => {
    const target = new Date("2026-05-31T12:00:00+09:00");

    expect(isPublishedInJstDateWindow("2026-05-30T15:00:00.000Z", target, 2)).toBe(true);
    expect(isPublishedInJstDateWindow("2026-05-29T15:00:00.000Z", target, 2)).toBe(true);
    expect(isPublishedInJstDateWindow("2026-05-29T14:59:59.000Z", target, 2)).toBe(false);
    expect(isPublishedInJstDateWindow(null, target, 2)).toBe(false);
  });
});
