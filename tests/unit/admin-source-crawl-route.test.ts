import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { crawlSourceMock, eqMock, fromMock, revalidatePathMock, selectMock, singleMock } = vi.hoisted(() => ({
  crawlSourceMock: vi.fn(),
  eqMock: vi.fn(),
  fromMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  selectMock: vi.fn(),
  singleMock: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("@/lib/crawler", () => ({
  crawlSource: crawlSourceMock
}));

vi.mock("@/lib/supabase", () => ({
  getOptionalServiceSupabase: () => ({
    from: fromMock
  })
}));

import { POST } from "@/app/api/admin/sources/[id]/crawl/route";

describe("admin source crawl route", () => {
  it("runs crawl for a single source and revalidates admin/public pages", async () => {
    const source = { id: "source-1", name: "Example", url: "https://example.com/news" };
    const result = { discovered: 3, processed: ["https://example.com/a"], skipped: ["https://example.com/b"] };
    singleMock.mockResolvedValueOnce({ data: source, error: null });
    eqMock.mockReturnValueOnce({ single: singleMock });
    selectMock.mockReturnValueOnce({ eq: eqMock });
    fromMock.mockReturnValueOnce({ select: selectMock });
    crawlSourceMock.mockResolvedValueOnce(result);

    const request = new Request("https://example.test/api/admin/sources/source-1/crawl", {
      method: "POST"
    });
    const response = await POST(request as NextRequest, { params: Promise.resolve({ id: "source-1" }) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, ...result });
    expect(fromMock).toHaveBeenCalledWith("sources");
    expect(eqMock).toHaveBeenCalledWith("id", "source-1");
    expect(crawlSourceMock).toHaveBeenCalledWith(source);
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/sources");
    expect(revalidatePathMock).toHaveBeenCalledWith("/articles");
  });
});
