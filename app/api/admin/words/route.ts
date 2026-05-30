import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { termInputSchema } from "@/lib/schemas";
import { isSafeOrigin } from "@/lib/security";
import { getOptionalServiceSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getOptionalServiceSupabase();
  if (!supabase) return NextResponse.json([]);
  const { data, error } = await supabase.from("terms_with_article_count").select("*").order("reading");
  if (error?.code === "PGRST205") {
    const fallback = await supabase.from("terms").select("*").order("reading");
    return fallback.error
      ? NextResponse.json({ error: fallback.error.message }, { status: 400 })
      : NextResponse.json(fallback.data);
  }
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  if (!isSafeOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const form = await request.formData();
  const input = termInputSchema.parse({
    headword: form.get("headword"),
    reading: form.get("reading"),
    description: form.get("description"),
    source_kind: "manual"
  });

  const supabase = getOptionalServiceSupabase();
  if (supabase) {
    const { error } = await supabase.from("terms").insert(input);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  revalidatePath("/admin/words");
  return NextResponse.redirect(new URL("/admin/words", request.url), { status: 303 });
}
