import type { Article, Report, Source, Term, UsageDaily } from "@/lib/types";

const now = new Date("2026-05-30T08:00:00+09:00");

export const fixtureSources: Source[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Northstar Mobility",
    url: "https://example.com/news",
    enabled: true,
    last_crawled_at: now.toISOString(),
    created_at: now.toISOString()
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Kumo Analytics",
    url: "https://example.org/press",
    enabled: true,
    last_crawled_at: now.toISOString(),
    created_at: now.toISOString()
  }
];

export const fixtureArticles: Article[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    source_id: fixtureSources[0].id,
    url: "https://example.com/news/ai-routing",
    title: "配送計画AIの実証実験を首都圏で開始",
    summary: "小売店舗向け配送計画AIを首都圏で実証し、車両稼働率と配送遅延の改善効果を検証します。",
    published_at: now.toISOString(),
    fetched_at: now.toISOString(),
    is_deleted: false,
    source: fixtureSources[0]
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    source_id: fixtureSources[1].id,
    url: "https://example.org/press/data-clean-room",
    title: "データクリーンルーム機能を正式提供",
    summary: "広告主と媒体社が個人情報を直接共有せずに分析できるデータクリーンルーム機能を提供します。",
    published_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    fetched_at: now.toISOString(),
    is_deleted: false,
    source: fixtureSources[1]
  }
];

export const fixtureTerms: Term[] = [
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    headword: "データクリーンルーム",
    reading: "でーたくりーんるーむ",
    description:
      "複数の事業者が個人情報を直接渡さず、制限された環境でデータを照合・分析する仕組みです。",
    source_kind: "ai",
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    article_count: 1
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    headword: "配送最適化",
    reading: "はいそうさいてきか",
    description:
      "配送先、車両、時間帯などの条件をもとに、移動距離や遅延を減らす計画を作ることです。",
    source_kind: "ai",
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    article_count: 1
  }
];

export const fixtureReports: Report[] = [
  {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    article_id: fixtureArticles[1].id,
    reason: "not_press_release",
    status: "open",
    created_at: now.toISOString(),
    resolved_at: null,
    article: fixtureArticles[1]
  }
];

export const fixtureUsage: UsageDaily[] = Array.from({ length: 14 }, (_, index) => {
  const date = new Date(now);
  date.setDate(now.getDate() - (13 - index));
  return {
    usage_date: date.toISOString().slice(0, 10),
    model: index % 2 === 0 ? "gpt-5.5" : "gpt-5.5-mini",
    cost_usd: Number((0.12 + index * 0.015).toFixed(4)),
    input_tokens: 2000 + index * 140,
    output_tokens: 600 + index * 35
  };
});
