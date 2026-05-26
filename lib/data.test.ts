import { describe, expect, it } from "vitest";
import { getArticle, getArticles, getDailyTerms, getDisplayDate, getFeaturedCompanies, getSources, getTermEntries, getTopicCounts } from "./data";
import { requireCronSecret } from "./cron";
import { pushSubscriptionSchema } from "./schemas";

describe("article data helpers", () => {
  it("filters articles by tag", () => {
    const articles = getArticles({ tag: "AI / 機械学習" });

    expect(articles.length).toBeGreaterThan(0);
    expect(articles.every((article) => article.tags.includes("AI / 機械学習"))).toBe(true);
  });

  it("uses detected_at label when published_at is missing", () => {
    const article = getArticle("next-finance-expense");

    expect(article).toBeDefined();
    expect(getDisplayDate(article!)).toContain("検知");
  });

  it("sorts companies and tags by activity", () => {
    expect(getFeaturedCompanies()[0].count).toBeGreaterThanOrEqual(getFeaturedCompanies()[1].count);
    expect(getTopicCounts(30)[0].count).toBeGreaterThanOrEqual(getTopicCounts(30)[1].count);
    expect(getDailyTerms().length).toBeGreaterThan(0);
    expect(getSources().length).toBeGreaterThan(0);
  });

  it("aggregates term entries with related articles", () => {
    const terms = getTermEntries();

    expect(terms.length).toBeGreaterThan(0);
    expect(terms[0].articles.length).toBeGreaterThan(0);
    expect(terms.some((term) => term.word === "デジタルツイン" && term.count > 1)).toBe(true);
    expect(terms.every((term) => term.articles.length >= 1 && term.tags.length >= 1)).toBe(true);
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
