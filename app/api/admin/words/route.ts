import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { termInputSchema } from "@/lib/schemas";
import { isSafeOrigin } from "@/lib/security";
import { getOptionalServiceSupabase } from "@/lib/supabase";

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
