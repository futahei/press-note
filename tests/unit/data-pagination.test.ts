import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getOptionalServiceSupabaseMock } = vi.hoisted(() => ({
  getOptionalServiceSupabaseMock: vi.fn()
}));

vi.mock("@/lib/supabase", () => ({
  getOptionalServiceSupabase: getOptionalServiceSupabaseMock
}));

import { countEnabledSources, getWordOfDay, listArticles, listHomeArticles, listTermsPage, listUsageDaily, selectWordOfDayIndex } from "@/lib/data";

describe("data pagination", () => {
  beforeEach(() => {
    getOptionalServiceSupabaseMock.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns article batches with hasMore", async () => {
    const first = await listArticles({ limit: "1" });
    const second = await listArticles({ page: "2", limit: "1" });

    expect(first.articles).toHaveLength(1);
    expect(first.hasMore).toBe(true);
    expect(second.articles).toHaveLength(1);
    expect(second.hasMore).toBe(false);
  });

  it("returns term batches with hasMore", async () => {
    const first = await listTermsPage({ limit: "1" });
    const second = await listTermsPage({ page: "2", limit: "1" });

    expect(first.terms).toHaveLength(1);
    expect(first.hasMore).toBe(true);
    expect(second.terms).toHaveLength(1);
    expect(second.hasMore).toBe(false);
  });

  it("returns articles from the last week for the home article feed", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T10:00:00+09:00"));

    const result = await listHomeArticles();

    expect(result.hasRecentArticles).toBe(true);
    expect(result.articles).toHaveLength(2);
  });

  it("returns an empty home article feed when the last week has no articles", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T10:00:00+09:00"));

    const result = await listHomeArticles();

    expect(result.hasRecentArticles).toBe(false);
    expect(result.articles).toHaveLength(0);
  });

  it("counts enabled sources for the home status", async () => {
    await expect(countEnabledSources()).resolves.toBe(2);
  });

  it("selects the word of the day deterministically by date", async () => {
    const date = new Date("2026-06-02T10:00:00+09:00");

    expect(selectWordOfDayIndex(date, 10)).toBe(selectWordOfDayIndex(date, 10));
    await expect(getWordOfDay(date)).resolves.toEqual(expect.objectContaining({ article_count: 1 }));
  });

  it("filters terms by kana row groups", async () => {
    const taRow = await listTermsPage({ initial: "た" });
    const haRow = await listTermsPage({ initial: "は" });

    expect(taRow.terms.map((term) => term.reading)).toContain("でーたくりーんるーむ");
    expect(haRow.terms.map((term) => term.reading)).toContain("はいそうさいてきか");
  });

  it("treats an out-of-range Supabase term page as the end of the list", async () => {
    const range = vi.fn().mockResolvedValue({
      data: null,
      count: null,
      error: {
        code: "PGRST103",
        details: "An offset of 24 was requested, but there are only 20 rows.",
        message: "Requested range not satisfiable"
      }
    });
    const request = {
      ilike: vi.fn(() => request),
      or: vi.fn(() => request),
      order: vi.fn(() => request),
      range
    };
    getOptionalServiceSupabaseMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => request)
      }))
    });

    const result = await listTermsPage({ initial: "あ", page: "2", limit: "24" });

    expect(result.terms).toEqual([]);
    expect(result.total).toBe(20);
    expect(result.hasMore).toBe(false);
    expect(request.or).toHaveBeenCalledWith(
      "reading.ilike.あ%,reading.ilike.い%,reading.ilike.う%,reading.ilike.え%,reading.ilike.お%,reading.ilike.ア%,reading.ilike.イ%,reading.ilike.ウ%,reading.ilike.エ%,reading.ilike.オ%"
    );
  });

  it("loads recent usage rows and returns them by ascending date", async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [
        {
          usage_date: "2026-05-02",
          model: "gpt-5.5",
          input_tokens: 20,
          output_tokens: 10,
          cost_usd: 0.02
        },
        {
          usage_date: "2026-05-01",
          model: "gpt-5.5",
          input_tokens: 10,
          output_tokens: 5,
          cost_usd: 0.01
        }
      ],
      error: null
    });
    const order = vi.fn(() => ({ limit }));
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    getOptionalServiceSupabaseMock.mockReturnValue({ from });

    const result = await listUsageDaily();

    expect(from).toHaveBeenCalledWith("llm_usage_daily");
    expect(order).toHaveBeenCalledWith("usage_date", { ascending: false });
    expect(limit).toHaveBeenCalledWith(120);
    expect(result.map((row) => row.usage_date)).toEqual(["2026-05-01", "2026-05-02"]);
  });
});
