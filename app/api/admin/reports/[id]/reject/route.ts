import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getOptionalServiceSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getOptionalServiceSupabase();
  if (supabase) {
    await supabase.from("reports").update({ status: "rejected", resolved_at: new Date().toISOString() }).eq("id", id);
  }
  revalidatePath("/admin/reports");
  return NextResponse.redirect(new URL("/admin/reports", request.url), { status: 303 });
}
