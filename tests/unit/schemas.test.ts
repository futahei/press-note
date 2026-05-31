import { describe, expect, it } from "vitest";
import {
  articleQuerySchema,
  articleReportSchema,
  articleSummarySchema,
  bugReportInputSchema,
  sourceInputSchema,
  termQuerySchema,
  termInputSchema
} from "@/lib/schemas";

describe("schemas", () => {
  it("accepts a valid source input", () => {
    expect(
      sourceInputSchema.parse({
        name: "Example",
        url: "https://example.com/press",
        initialImportCount: "5"
      }).initialImportCount
    ).toBe(5);
  });

  it("rejects summaries over 120 characters", () => {
    expect(() =>
      articleSummarySchema.parse({
        title: "title",
        summary: "あ".repeat(121),
        published_at: null,
        is_press_release: true,
        terms: []
      })
    ).toThrow();
  });

  it("accepts summaries around 100 characters", () => {
    expect(
      articleSummarySchema.parse({
        title: "title",
        summary: "あ".repeat(110),
        published_at: null,
        is_press_release: true,
        terms: []
      }).summary.length
    ).toBe(110);
  });

  it("normalizes loose published_at values from AI output", () => {
    expect(
      articleSummarySchema.parse({
        title: "title",
        summary: "summary",
        published_at: "2026-05-30",
        is_press_release: true,
        terms: []
      }).published_at
    ).toBe("2026-05-30T00:00:00.000Z");

    expect(
      articleSummarySchema.parse({
        title: "title",
        summary: "summary",
        published_at: "2026年5月30日",
        is_press_release: true,
        terms: []
      }).published_at
    ).toBe("2026-05-30T00:00:00.000Z");
  });

  it("treats unknown published_at values as null", () => {
    expect(
      articleSummarySchema.parse({
        title: "title",
        summary: "summary",
        published_at: "不明",
        is_press_release: true,
        terms: []
      }).published_at
    ).toBeNull();
  });

  it("accepts manual terms", () => {
    expect(
      termInputSchema.parse({
        headword: "データクリーンルーム",
        reading: "でーたくりーんるーむ",
        description: "個人情報を直接共有せずに分析する環境です。"
      }).source_kind
    ).toBe("manual");
  });

  it("accepts report reasons", () => {
    expect(articleReportSchema.parse({ reason: "duplicate" }).reason).toBe("duplicate");
    expect(articleReportSchema.parse({}).reason).toBe("not_press_release");
    expect(() => articleReportSchema.parse({ reason: "other" })).toThrow();
  });

  it("accepts anonymous bug reports with client context", () => {
    const report = bugReportInputSchema.parse({
      message: "一覧画面でボタンを押しても反応しません。",
      path: "/articles?source=11111111-1111-4111-8111-111111111111",
      user_agent: "Mozilla/5.0",
      viewport: "390x844",
      language: "ja-JP",
      timezone: "Asia/Tokyo",
      logs: [
        {
          level: "error",
          message: "Button handler failed",
          occurred_at: "2026-05-31T00:00:00.000Z"
        }
      ]
    });

    expect(report.logs).toHaveLength(1);
    expect(report.path).toContain("/articles");
  });

  it("treats empty article query fields as unspecified", () => {
    const query = articleQuerySchema.parse({
      q: "",
      source: "",
      from: "",
      to: "",
      limit: "12"
    });

    expect(query.q).toBeUndefined();
    expect(query.source).toBeUndefined();
    expect(query.from).toBeUndefined();
    expect(query.to).toBeUndefined();
    expect(query.limit).toBe(12);
  });

  it("treats empty term query fields as unspecified", () => {
    const query = termQuerySchema.parse({
      q: "",
      initial: "",
      page: "2",
      limit: "24"
    });

    expect(query.q).toBeUndefined();
    expect(query.initial).toBeUndefined();
    expect(query.page).toBe(2);
    expect(query.limit).toBe(24);
  });
});
