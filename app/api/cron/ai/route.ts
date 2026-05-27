import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/cron";
import { processArticleAi } from "@/lib/source-ai";
import { getSupabaseAdminClient } from "@/lib/supabase";

type RawArticleForAi = {
  id: string;
  title: string;
  source_url: string;
};

export async function POST(request: Request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase service role key is not configured" }, { status: 503 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 503 });
  }

  const { data, error } = await client
    .from("articles")
    .select("id, title, source_url")
    .is("ai_processed_at", null)
    .is("hidden_at", null)
    .order("detected_at", { ascending: true })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];
  for (const article of (data ?? []) as RawArticleForAi[]) {
    results.push(await processArticleAi(client, article));
  }

  return NextResponse.json({
    data: {
      job: "ai",
      processed_articles: results.filter((result) => result.status === "ok").length,
      model: process.env.OPENAI_MODEL ?? "gpt-5.5",
      results
    }
  });
}
