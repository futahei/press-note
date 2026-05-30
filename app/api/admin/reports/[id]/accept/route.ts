import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getOptionalServiceSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getOptionalServiceSupabase();
  if (supabase) {
    const { data: report } = await supabase
      .from("reports")
      .select("article_id, article:articles(url)")
      .eq("id", id)
      .single();
    if (report?.article_id) {
      const article = Array.isArray(report.article) ? report.article[0] : report.article;
      if (article?.url) {
        await supabase
          .from("rejected_article_urls")
          .upsert({ url: article.url, article_id: report.article_id });
      }
      await supabase.from("article_terms").delete().eq("article_id", report.article_id);
      await supabase.from("articles").update({ is_deleted: true }).eq("id", report.article_id);
      await supabase.from("reports").update({ status: "accepted", resolved_at: new Date().toISOString() }).eq("id", id);
    }
  }
  revalidatePath("/admin/reports");
  revalidatePath("/");
  return NextResponse.redirect(new URL("/admin/reports", request.url), { status: 303 });
}
