import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getOptionalServiceSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getOptionalServiceSupabase();

  if (supabase) {
    const { error } = await supabase
      .from("bug_reports")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  revalidatePath("/admin/bug-reports");
  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL("/admin/bug-reports", request.url), { status: 303 });
}
