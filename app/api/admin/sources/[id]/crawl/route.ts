import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { crawlSource } from "@/lib/crawler";
import { isSafeOrigin } from "@/lib/security";
import { getOptionalServiceSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSafeOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const supabase = getOptionalServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { id } = await params;
  const { data: source, error } = await supabase.from("sources").select("id,name,url").eq("id", id).single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  try {
    const result = await crawlSource(source);
    revalidatePath("/");
    revalidatePath("/articles");
    revalidatePath("/admin");
    revalidatePath("/admin/sources");

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Crawl failed" }, { status: 500 });
  }
}
