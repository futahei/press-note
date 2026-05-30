import { NextResponse } from "next/server";
import { getOptionalServiceSupabase } from "@/lib/supabase";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getOptionalServiceSupabase();
  if (!supabase) return NextResponse.json({ ok: true });

  const { error } = await supabase.from("reports").insert({ article_id: id });
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
