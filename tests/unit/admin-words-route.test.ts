import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { listTermsPageMock, revalidatePathMock } = vi.hoisted(() => ({
  listTermsPageMock: vi.fn(),
  revalidatePathMock: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("@/lib/data", () => ({
  listTermsPage: listTermsPageMock
}));

vi.mock("@/lib/supabase", () => ({
  getOptionalServiceSupabase: vi.fn()
}));

import { GET } from "@/app/api/admin/words/route";

describe("admin words route", () => {
  it("returns paginated terms for infinite scrolling", async () => {
    const payload = {
      terms: [],
      total: 20,
      page: 2,
      limit: 24,
      hasMore: false
    };
    listTermsPageMock.mockResolvedValueOnce(payload);

    const request = new Request("https://example.test/api/admin/words?page=2&limit=24");
    const response = await GET(request as NextRequest);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(payload);
    expect(listTermsPageMock).toHaveBeenCalledWith({ page: "2", limit: "24" });
  });
});
