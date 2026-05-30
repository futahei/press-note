import * as cheerio from "cheerio";
import { getServiceSupabase } from "@/lib/supabase";
import { summarizePressReleaseUrl } from "@/lib/openai";
import type { Source } from "@/lib/types";

export async function discoverLinksFromListing(listingUrl: string): Promise<string[]> {
  const response = await fetch(listingUrl, {
    headers: {
      "user-agent": "PressNote/0.1 (+https://pressnote.example)"
    },
    next: { revalidate: 0 }
  });
  if (!response.ok) return [];

  const html = await response.text();
  const $ = cheerio.load(html);
  const base = new URL(listingUrl);
  const seen = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    try {
      const url = new URL(href, base);
      if (url.origin === base.origin) seen.add(url.toString());
    } catch {
      // Ignore invalid href values from source pages.
    }
  });

  return [...seen].slice(0, 20);
}

export async function crawlSource(source: Pick<Source, "id" | "name" | "url">) {
  const supabase = getServiceSupabase();
  const links = await discoverLinksFromListing(source.url);
  const processed: string[] = [];
  const skipped: string[] = [];

  for (const url of links.slice(0, 20)) {
    const { data: existing, error: existingError } = await supabase
      .from("articles")
      .select("id")
      .eq("url", url)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      skipped.push(url);
      continue;
    }

    const summary = await summarizePressReleaseUrl(url);
    if (!summary.is_press_release) {
      skipped.push(url);
      continue;
    }

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .insert({
        source_id: source.id,
        url,
        title: summary.title,
        summary: summary.summary,
        published_at: summary.published_at
      })
      .select("id")
      .single();
    if (articleError) throw articleError;

    for (const term of summary.terms) {
      const { data: upserted, error: termError } = await supabase
        .from("terms")
        .upsert({ ...term, source_kind: "ai" }, { onConflict: "headword", ignoreDuplicates: true })
        .select("id")
        .single();
      if (termError) throw termError;
      await supabase.from("article_terms").upsert({ article_id: article.id, term_id: upserted.id });
    }

    processed.push(url);
  }

  await supabase.from("sources").update({ last_crawled_at: new Date().toISOString() }).eq("id", source.id);
  return { processed, skipped, discovered: links.length };
}
