import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { sourceUpdateSchema } from "@/lib/schemas";
import { isSafeOrigin } from "@/lib/security";
import { getOptionalServiceSupabase } from "@/lib/supabase";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSafeOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const { id } = await params;
  const input = sourceUpdateSchema.parse(await request.json());
  const supabase = getOptionalServiceSupabase();

  if (supabase) {
    const { error } = await supabase.from("sources").update(input).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/admin/sources");
  revalidatePath("/articles");
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSafeOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const { id } = await params;
  const supabase = getOptionalServiceSupabase();

  if (supabase) {
    const { error } = await supabase.from("sources").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/admin/sources");
  revalidatePath("/");
  revalidatePath("/articles");
  return NextResponse.json({ ok: true });
}
