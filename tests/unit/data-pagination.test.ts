import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  getOptionalServiceSupabase: () => null
}));

import { listArticles, listTermsPage } from "@/lib/data";

describe("data pagination", () => {
  it("returns article batches with hasMore", async () => {
    const first = await listArticles({ limit: "1" });
    const second = await listArticles({ page: "2", limit: "1" });

    expect(first.articles).toHaveLength(1);
    expect(first.hasMore).toBe(true);
    expect(second.articles).toHaveLength(1);
    expect(second.hasMore).toBe(false);
  });

  it("returns term batches with hasMore", async () => {
    const first = await listTermsPage({ limit: "1" });
    const second = await listTermsPage({ page: "2", limit: "1" });

    expect(first.terms).toHaveLength(1);
    expect(first.hasMore).toBe(true);
    expect(second.terms).toHaveLength(1);
    expect(second.hasMore).toBe(false);
  });
});
