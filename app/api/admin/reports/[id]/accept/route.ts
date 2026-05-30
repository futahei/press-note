import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getOptionalServiceSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getOptionalServiceSupabase();
  if (supabase) {
    const { data: report } = await supabase.from("reports").select("article_id").eq("id", id).single();
    if (report) {
      await supabase.from("articles").update({ is_deleted: true }).eq("id", report.article_id);
      await supabase.from("reports").update({ status: "accepted", resolved_at: new Date().toISOString() }).eq("id", id);
    }
  }
  revalidatePath("/admin/reports");
  revalidatePath("/");
  return NextResponse.redirect(new URL("/admin/reports", request.url), { status: 303 });
}
