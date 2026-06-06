import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { summarizePressReleaseUrl } from "@/lib/openai";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

describe("summarizePressReleaseUrl", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("instructs the model to exclude generic terms from term extraction", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        output_text: JSON.stringify({
          title: "新製品の提供を開始",
          summary:
            "新製品の提供開始により、工場内の搬送作業を自動化し、導入企業の人手不足対策と運用効率化を支援する内容です。安全性と保守性も高め、今後は対応拠点を順次拡大する計画です。",
          published_at: "2026-06-06T09:00:00+09:00",
          is_press_release: true,
          terms: [
            {
              headword: "自律走行ロボット",
              reading: "じりつそうこうろぼっと",
              description: "周囲の環境を認識しながら、人の操作なしで目的地まで移動するロボット。"
            }
          ]
        })
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await summarizePressReleaseUrl("https://example.com/news/robot");

    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string) as {
      input: Array<{ role: string; content: string }>;
    };
    const prompt = body.input.map((item) => item.content).join("\n");

    expect(prompt).toContain("一般的なビジネス語");
    expect(prompt).toContain("AI、DX、クラウド");
    expect(prompt).toContain("迷う場合は抽出しない");
    expect(prompt).toContain("記事文脈を持ち込まず");
    expect(prompt).toContain("一般語や単独の英語表現は terms に入れない");
  });
});
