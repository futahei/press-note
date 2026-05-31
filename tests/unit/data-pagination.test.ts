import { beforeEach, describe, expect, it, vi } from "vitest";

const { getOptionalServiceSupabaseMock } = vi.hoisted(() => ({
  getOptionalServiceSupabaseMock: vi.fn()
}));

vi.mock("@/lib/supabase", () => ({
  getOptionalServiceSupabase: getOptionalServiceSupabaseMock
}));

import { listArticles, listTermsPage } from "@/lib/data";

describe("data pagination", () => {
  beforeEach(() => {
    getOptionalServiceSupabaseMock.mockReturnValue(null);
  });

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

  it("treats an out-of-range Supabase term page as the end of the list", async () => {
    const range = vi.fn().mockResolvedValue({
      data: null,
      count: null,
      error: {
        code: "PGRST103",
        details: "An offset of 24 was requested, but there are only 20 rows.",
        message: "Requested range not satisfiable"
      }
    });
    const request = {
      ilike: vi.fn(() => request),
      order: vi.fn(() => request),
      range
    };
    getOptionalServiceSupabaseMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => request)
      }))
    });

    const result = await listTermsPage({ initial: "あ", page: "2", limit: "24" });

    expect(result.terms).toEqual([]);
    expect(result.total).toBe(20);
    expect(result.hasMore).toBe(false);
    expect(request.ilike).toHaveBeenCalledWith("reading", "あ%");
  });
});
