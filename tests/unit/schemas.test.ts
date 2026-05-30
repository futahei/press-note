import { describe, expect, it } from "vitest";
import { articleSummarySchema, sourceInputSchema, termInputSchema } from "@/lib/schemas";

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

  it("rejects summaries over 100 characters", () => {
    expect(() =>
      articleSummarySchema.parse({
        title: "title",
        summary: "あ".repeat(101),
        published_at: null,
        is_press_release: true,
        terms: []
      })
    ).toThrow();
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
});
