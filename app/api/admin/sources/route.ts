import { NextResponse } from "next/server";
import { z } from "zod";
import { getSources } from "@/lib/data";
import { defaultSelectors, faviconUrl } from "@/lib/content";
import { crawlSource } from "@/lib/source-crawl";
import { getSupabaseAdminClient } from "@/lib/supabase";

const createSourceSchema = z.object({
  companyId: z.string().uuid().optional(),
  companyName: z.string().min(1).optional(),
  companyLogoUrl: z.string().url().optional(),
  companyDescription: z.string().optional(),
  url: z.string().url(),
  mode: z.enum(["rss", "scrape", "pdf_link"]).default("scrape"),
  selectors: z.record(z.string()).optional(),
  backfillLimit: z.number().int().min(0).max(20).default(5)
});

export async function GET() {
  return NextResponse.json({ data: await getSources() });
}

export async function POST(request: Request) {
  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase service role key is not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid source", issues: parsed.error.issues }, { status: 400 });
  }

  let companyId = parsed.data.companyId;
  if (!companyId) {
    if (!parsed.data.companyName) {
      return NextResponse.json({ error: "companyId or companyName is required" }, { status: 400 });
    }

    const { data: company, error: companyError } = await client
      .from("companies")
      .insert({
        name: parsed.data.companyName,
        logo_url: parsed.data.companyLogoUrl ?? faviconUrl(parsed.data.url),
        description: parsed.data.companyDescription ?? null
      })
      .select("id")
      .single();

    if (companyError) {
      return NextResponse.json({ error: companyError.message }, { status: 500 });
    }
    companyId = company.id;
  }

  const selectors = parsed.data.selectors ?? defaultSelectors;
  const { data, error } = await client
    .from("sources")
    .insert({
      company_id: companyId,
      url: parsed.data.url,
      mode: parsed.data.mode,
      selectors,
      enabled: true,
      health: "ok"
    })
    .select("id, company_id, url, mode, enabled, health, selectors")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const crawl =
    parsed.data.backfillLimit > 0
      ? await crawlSource(
          client,
          {
            id: data.id,
            company_id: data.company_id,
            url: data.url,
            mode: data.mode,
            selectors: data.selectors
          },
          parsed.data.backfillLimit
        )
      : undefined;

  return NextResponse.json({ data: { ...data, crawl } }, { status: 201 });
}
