import { z } from "zod";
import { articleSummarySchema, type ArticleSummaryOutput } from "@/lib/schemas";
import { env, requiredEnv } from "@/lib/env";

const summaryJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "published_at", "is_press_release", "terms"],
  properties: {
    title: { type: "string" },
    summary: {
      type: "string",
      minLength: 80,
      maxLength: 120,
      description: "記事本文の要約。日本語で90〜110文字程度。"
    },
    published_at: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "公開日時。取得できる場合は ISO 8601 datetime with timezone、取得できない場合は null。"
    },
    is_press_release: { type: "boolean" },
    terms: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["headword", "reading", "description"],
        properties: {
          headword: { type: "string" },
          reading: { type: "string" },
          description: { type: "string" }
        }
      }
    }
  }
} as const;

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

const urlListSchema = z.object({
  urls: z.array(z.string().url())
});

const urlListJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["urls"],
  properties: {
    urls: {
      type: "array",
      items: { type: "string" }
    }
  }
} as const;

function extractText(payload: ResponsesPayload): string {
  if (payload.output_text) return payload.output_text;
  for (const output of payload.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new Error("OpenAI response did not include output text");
}

function usageFrom(payload: ResponsesPayload) {
  return {
    input_tokens: payload.usage?.input_tokens ?? 0,
    output_tokens: payload.usage?.output_tokens ?? 0,
    cost_usd: 0
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createResponse(body: unknown): Promise<ResponsesPayload> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          authorization: `Bearer ${requiredEnv("OPENAI_API_KEY")}`,
          "content-type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        return (await response.json()) as ResponsesPayload;
      }

      lastError = new Error(`OpenAI request failed: ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("OpenAI request failed");
    }

    await sleep(2 ** attempt * 500);
  }

  throw lastError ?? new Error("OpenAI request failed");
}

export async function summarizePressReleaseUrl(
  url: string
): Promise<ArticleSummaryOutput & { usage: ReturnType<typeof usageFrom> }> {
  const model = env("OPENAI_MODEL") ?? "gpt-5.5";
  const payload = await createResponse({
    model,
    tools: [{ type: "web_search" }],
    tool_choice: "required",
    input: [
      {
        role: "system",
        content:
          "あなたは日本語のプレスリリース編集者です。記事本文を確認し、プレスリリースだけを日本語90〜110文字程度で要約し、読者がつまずく専門用語を抽出してください。summary は短すぎる箇条書きではなく、本文の要点が分かる1〜2文にしてください。published_at は ISO 8601 datetime with timezone で返し、公開日時が取得できない場合は null にしてください。"
      },
      {
        role: "user",
        content: `次のURLの本文を取得し、90〜110文字程度の要約と専門用語を抽出してください: ${url}`
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "press_release_summary",
        schema: summaryJsonSchema,
        strict: true
      }
    }
  });
  const result = articleSummarySchema.parse(JSON.parse(extractText(payload)));

  return { ...result, usage: usageFrom(payload) };
}

export async function searchPressReleaseUrls(
  prompt: string,
  purpose: "crawl_step_a" | "crawl_step_b" | "crawl_step_c"
): Promise<{ urls: string[]; usage: ReturnType<typeof usageFrom>; purpose: string }> {
  const model = env("OPENAI_MODEL") ?? "gpt-5.5";
  const payload = await createResponse({
    model,
    tools: [{ type: "web_search" }],
    tool_choice: "required",
    input: [
      {
        role: "system",
        content:
          "あなたは企業公式サイトのプレスリリースURLだけを抽出する調査員です。公式URLのみを返し、重複や一覧ページを除外してください。"
      },
      { role: "user", content: prompt }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "press_release_urls",
        schema: urlListJsonSchema,
        strict: true
      }
    }
  });

  return { ...urlListSchema.parse(JSON.parse(extractText(payload))), usage: usageFrom(payload), purpose };
}
