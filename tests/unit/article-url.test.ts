import { describe, expect, it } from "vitest";
import { dedupeArticlesByUrl, normalizeArticleUrl } from "@/lib/article-url";

describe("article URL normalization", () => {
  it("normalizes tracking parameters, hashes, host casing, and trailing slashes", () => {
    expect(normalizeArticleUrl("HTTPS://Example.COM/news/detail/?utm_source=x&b=2&a=1#section")).toBe(
      "https://example.com/news/detail?a=1&b=2"
    );
  });

  it("deduplicates articles by normalized destination URL", () => {
    const articles = dedupeArticlesByUrl([
      { id: "first", url: "https://example.com/news/1?utm_source=mail#top" },
      { id: "duplicate", url: "https://example.com/news/1/" },
      { id: "second", url: "https://example.com/news/2?gclid=tracking" }
    ]);

    expect(articles.map((article) => article.id)).toEqual(["first", "second"]);
  });
});
