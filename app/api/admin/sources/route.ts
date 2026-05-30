import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { saveSummarizedArticle } from "@/lib/crawler";
import { previewArticleSchema, sourceCreateJsonSchema, sourceInputSchema, type PreviewArticle } from "@/lib/schemas";
import { isSafeOrigin } from "@/lib/security";
import { getOptionalServiceSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getOptionalServiceSupabase();
  if (!supabase) return NextResponse.json([]);
  const { data, error } = await supabase.from("sources").select("*").order("created_at", { ascending: false });
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  if (!isSafeOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const isJson = request.headers.get("content-type")?.includes("application/json");
  let previewArticles: PreviewArticle[] = [];
  const input = isJson
    ? sourceCreateJsonSchema.parse(await request.json())
    : sourceInputSchema.parse({
        ...(Object.fromEntries(await request.formData()) as Record<string, unknown>),
        enabled: true
      });
  if ("previewArticles" in input) {
    previewArticles = previewArticleSchema.array().parse(input.previewArticles);
  }

  const supabase = getOptionalServiceSupabase();
  if (supabase) {
    const { data: source, error } = await supabase
      .from("sources")
      .insert({
        name: input.name,
        url: input.url,
        enabled: input.enabled
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    for (const article of previewArticles) {
      await saveSummarizedArticle({ sourceId: source.id, url: article.url, summary: article });
    }
  }
  revalidatePath("/admin/sources");
  revalidatePath("/");
  revalidatePath("/articles");

  return isJson
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(new URL("/admin/sources", request.url), { status: 303 });
}
