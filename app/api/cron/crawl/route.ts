import { NextRequest, NextResponse } from "next/server";
import { crawlSource } from "@/lib/crawler";
import { isCronAuthorized } from "@/lib/security";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sourceId = request.nextUrl.searchParams.get("source");
  if (!sourceId) return NextResponse.json({ error: "source is required" }, { status: 400 });

  const supabase = getServiceSupabase();
  const { data: source, error } = await supabase.from("sources").select("id,name,url").eq("id", sourceId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return NextResponse.json(await crawlSource(source));
}
