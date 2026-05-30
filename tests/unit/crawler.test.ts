import { describe, expect, it } from "vitest";
import { buildPressReleaseDiscoveryPrompt } from "@/lib/crawler";

describe("buildPressReleaseDiscoveryPrompt", () => {
  it("includes the AI discovery steps and requested count", () => {
    const prompt = buildPressReleaseDiscoveryPrompt(
      { name: "テスト株式会社", url: "https://example.com/news" },
      5
    );

    expect(prompt).toContain("最大 5 件");
    expect(prompt).toContain(
      "1. https://example.com/news を調べ、ページ本文の主コンテンツ領域にある記事一覧、リスト、カードから最新のプレスリリースを取得する"
    );
    expect(prompt).toContain(
      "ヘッダー、グローバルナビ、フッター、サイドバー、関連記事、別カテゴリのニュースリンクにあるURLは除外してください。"
    );
    expect(prompt).toContain(
      "2. 指定した数のプレスリリースを取得できなければ、https://example.com/news のドメイン（example.com）内でWeb検索して最新のプレスリリースを取得する"
    );
    expect(prompt).toContain(
      "3. それでも指定した数のプレスリリースを取得できなければ、「テスト株式会社 プレスリリース」でWeb検索を行い、最新のプレスリリースを取得する"
    );
  });
});
