import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/cron";
import { crawlSource, type CrawlableSource } from "@/lib/source-crawl";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase service role key is not configured" }, { status: 503 });
  }

  const { data, error } = await client
    .from("sources")
    .select("id, company_id, url, mode, selectors")
    .eq("enabled", true)
    .is("deleted_at", null)
    .order("last_crawled_at", { ascending: true, nullsFirst: true })
    .limit(3);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];
  for (const source of (data ?? []) as CrawlableSource[]) {
    results.push(await crawlSource(client, source, 20));
  }

  return NextResponse.json({
    data: {
      job: "crawl",
      processed_sources: results.length,
      items_found: results.reduce((sum, result) => sum + result.itemsFound, 0),
      items_new: results.reduce((sum, result) => sum + result.itemsNew, 0),
      results
    }
  });
}
