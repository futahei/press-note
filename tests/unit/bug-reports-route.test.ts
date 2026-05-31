import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { eqMock, fromMock, revalidatePathMock } = vi.hoisted(() => ({
  eqMock: vi.fn(),
  fromMock: vi.fn(),
  revalidatePathMock: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("@/lib/supabase", () => ({
  getOptionalServiceSupabase: () => ({
    from: fromMock
  })
}));

import { POST } from "@/app/api/admin/bug-reports/[id]/resolve/route";

describe("bug report resolve route", () => {
  it("marks a bug report resolved and returns JSON for client-side actions", async () => {
    eqMock.mockResolvedValueOnce({ error: null });
    fromMock.mockReturnValueOnce({
      update: vi.fn(() => ({
        eq: eqMock
      }))
    });

    const request = new Request("https://example.test/api/admin/bug-reports/bug-1/resolve", {
      method: "POST",
      headers: { Accept: "application/json" }
    });

    const response = await POST(request as NextRequest, { params: Promise.resolve({ id: "bug-1" }) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(fromMock).toHaveBeenCalledWith("bug_reports");
    expect(eqMock).toHaveBeenCalledWith("id", "bug-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/bug-reports");
  });
});
