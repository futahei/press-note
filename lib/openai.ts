import { articleSummarySchema, type ArticleSummaryOutput } from "@/lib/schemas";
import { env, requiredEnv } from "@/lib/env";

const summaryJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary", "published_at", "is_press_release", "terms"],
  properties: {
    title: { type: "string" },
    summary: { type: "string", maxLength: 100 },
    published_at: { anyOf: [{ type: "string" }, { type: "null" }] },
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

function extractText(payload: ResponsesPayload): string {
  if (payload.output_text) return payload.output_text;
  for (const output of payload.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new Error("OpenAI response did not include output text");
}

export async function summarizePressReleaseUrl(url: string): Promise<ArticleSummaryOutput> {
  const model = env("OPENAI_MODEL") ?? "gpt-5.5";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${requiredEnv("OPENAI_API_KEY")}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      tools: [{ type: "web_search" }],
      tool_choice: "required",
      input: [
        {
          role: "system",
          content:
            "あなたは日本語のプレスリリース編集者です。記事本文を確認し、プレスリリースだけを100文字以内で要約し、読者がつまずく専門用語を抽出してください。"
        },
        {
          role: "user",
          content: `次のURLの本文を取得し、100文字以内の要約と専門用語を抽出してください: ${url}`
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
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const payload = (await response.json()) as ResponsesPayload;
  return articleSummarySchema.parse(JSON.parse(extractText(payload)));
}
