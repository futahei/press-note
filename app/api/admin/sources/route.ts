import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sourceInputSchema } from "@/lib/schemas";
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
  const form = await request.formData();
  const input = sourceInputSchema.parse({
    name: form.get("name"),
    url: form.get("url"),
    initialImportCount: form.get("initialImportCount"),
    enabled: true
  });

  const supabase = getOptionalServiceSupabase();
  if (supabase) {
    const { error } = await supabase.from("sources").insert({
      name: input.name,
      url: input.url,
      enabled: input.enabled
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  revalidatePath("/admin/sources");
  return NextResponse.redirect(new URL("/admin/sources", request.url), { status: 303 });
}
