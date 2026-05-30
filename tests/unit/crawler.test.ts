import { describe, expect, it } from "vitest";
import { rankListingLinks } from "@/lib/crawler";

describe("rankListingLinks", () => {
  it("keeps likely press release article URLs and filters navigation links", () => {
    const links = rankListingLinks([
      { url: "https://example.com/contact", text: "お問い合わせ" },
      { url: "https://example.com/news/category/press", text: "プレスリリース一覧" },
      { url: "https://example.com/assets/logo.png", text: "" },
      { url: "https://example.com/news/2026/05/31/product-a", text: "新製品のニュースリリース" },
      { url: "https://example.com/topics/20260530.html", text: "サービス提供開始のお知らせ" }
    ]);

    expect(links).toEqual([
      "https://example.com/news/2026/05/31/product-a",
      "https://example.com/topics/20260530.html"
    ]);
  });
});
