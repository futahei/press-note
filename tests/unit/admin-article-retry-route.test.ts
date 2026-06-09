import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { getOptionalServiceSupabaseMock, resummarizeArticleMock, revalidatePathMock } = vi.hoisted(() => ({
  getOptionalServiceSupabaseMock: vi.fn(),
  resummarizeArticleMock: vi.fn(),
  revalidatePathMock: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("@/lib/crawler", () => ({
  resummarizeArticle: resummarizeArticleMock
}));

vi.mock("@/lib/supabase", () => ({
  getOptionalServiceSupabase: getOptionalServiceSupabaseMock
}));

import { POST } from "@/app/api/admin/articles/[id]/retry/route";

describe("admin article retry route", () => {
  it("re-summarizes an article with the supplied URL and revalidates affected pages", async () => {
    getOptionalServiceSupabaseMock.mockReturnValue({});
    resummarizeArticleMock.mockResolvedValue({
      id: "article-1",
      url: "https://example.com/release",
      title: "更新後タイトル",
      summary:
        "更新後の要約です。対象URLの本文をもとに、発表内容の重要なポイントを自然な日本語で把握できるようにまとめています。",
      published_at: "2026-06-10T09:00:00+09:00"
    });

    const request = new Request("https://example.test/api/admin/articles/article-1/retry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/release" })
    });
    const response = await POST(request as NextRequest, { params: Promise.resolve({ id: "article-1" }) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      article: {
        id: "article-1",
        url: "https://example.com/release",
        title: "更新後タイトル",
        summary:
          "更新後の要約です。対象URLの本文をもとに、発表内容の重要なポイントを自然な日本語で把握できるようにまとめています。",
        published_at: "2026-06-10T09:00:00+09:00"
      }
    });
    expect(resummarizeArticleMock).toHaveBeenCalledWith({
      articleId: "article-1",
      url: "https://example.com/release"
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/articles");
    expect(revalidatePathMock).toHaveBeenCalledWith("/articles/article-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/articles");
  });
});
