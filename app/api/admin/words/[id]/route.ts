import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { termUpdateSchema } from "@/lib/schemas";
import { isSafeOrigin } from "@/lib/security";
import { getOptionalServiceSupabase } from "@/lib/supabase";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSafeOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const { id } = await params;
  const input = termUpdateSchema.parse(await request.json());
  const supabase = getOptionalServiceSupabase();

  if (supabase) {
    const { error } = await supabase
      .from("terms")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/admin/words");
  revalidatePath("/terms");
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSafeOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const { id } = await params;
  const supabase = getOptionalServiceSupabase();

  if (supabase) {
    const { error } = await supabase.from("terms").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/admin/words");
  revalidatePath("/terms");
  return NextResponse.json({ ok: true });
}
