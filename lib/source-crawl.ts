import type { SupabaseClient } from "@supabase/supabase-js";
import { defaultSelectors, extractPressLinks, extractRssItems, fetchText, sha256, type SourceMode, type SourceSelectors } from "./content";

export type CrawlableSource = {
  id: string;
  company_id: string;
  url: string;
  mode: SourceMode;
  selectors?: SourceSelectors | null;
};

export type CrawlResult = {
  sourceId: string;
  itemsFound: number;
  itemsNew: number;
  status: "ok" | "error" | "skipped";
  message?: string;
};

export async function crawlSource(client: SupabaseClient, source: CrawlableSource, limit = 20): Promise<CrawlResult> {
  const startedAt = new Date().toISOString();
  try {
    const body = await fetchText(source.url);
    const items =
      source.mode === "rss" ? extractRssItems(body, source.url, limit) : extractPressLinks(body, source.url, limit);

    let itemsNew = 0;
    for (const item of items) {
      const sourceItemId = sha256(item.url);
      const { error } = await client.from("articles").insert({
        source_id: source.id,
        company_id: source.company_id,
        source_item_id: sourceItemId,
        title: item.title,
        source_url: item.url,
        published_at: item.publishedAt ?? null,
        detected_at: new Date().toISOString(),
        summary_short: "",
        summary_long: "",
        tags: [],
        content_hash: sourceItemId
      });

      if (!error) {
        itemsNew += 1;
        continue;
      }

      if (error.code !== "23505") {
        throw new Error(error.message);
      }
    }

    await Promise.all([
      client.from("sources").update({ last_crawled_at: new Date().toISOString(), health: "ok", selectors: source.selectors ?? defaultSelectors }).eq("id", source.id),
      client.from("crawl_logs").insert({
        source_id: source.id,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        status: "ok",
        items_found: items.length,
        items_new: itemsNew
      })
    ]);

    return { sourceId: source.id, itemsFound: items.length, itemsNew, status: "ok" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown crawl error";
    await Promise.all([
      client.from("sources").update({ last_crawled_at: new Date().toISOString(), health: "degraded" }).eq("id", source.id),
      client.from("crawl_logs").insert({
        source_id: source.id,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        status: "error",
        message,
        items_found: 0,
        items_new: 0
      })
    ]);
    return { sourceId: source.id, itemsFound: 0, itemsNew: 0, status: "error", message };
  }
}
