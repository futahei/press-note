import { NextResponse } from "next/server";
import { articleReportSchema } from "@/lib/schemas";
import { getOptionalServiceSupabase } from "@/lib/supabase";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const input = articleReportSchema.parse(await request.json().catch(() => ({})));
  const supabase = getOptionalServiceSupabase();
  if (!supabase) return NextResponse.json({ ok: true });

  const { error } = await supabase.from("reports").insert({ article_id: id, reason: input.reason });
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
