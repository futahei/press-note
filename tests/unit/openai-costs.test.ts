import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listOpenAICostsForCurrentMonth } from "@/lib/openai-costs";

function unixSeconds(value: string) {
  return Math.floor(new Date(value).getTime() / 1000);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

describe("listOpenAICostsForCurrentMonth", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns an unavailable result when the OpenAI Admin key is not configured", async () => {
    const result = await listOpenAICostsForCurrentMonth(new Date("2026-05-31T12:00:00+09:00"));

    expect(result.available).toBe(false);
    expect(result.costs).toEqual([]);
    expect(result.error).toContain("OPENAI_ADMIN_API_KEY");
  });

  it("uses hourly costs for the current day when the API returns them", async () => {
    vi.stubEnv("OPENAI_ADMIN_API_KEY", "admin-key");
    vi.stubEnv("OPENAI_COST_API_KEY_ID", "key_pressnote");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: [
            {
              start_time: unixSeconds("2026-05-30T00:00:00+09:00"),
              end_time: unixSeconds("2026-05-31T00:00:00+09:00"),
              results: [{ line_item: "Responses API", amount: { value: 1.25, currency: "usd" } }]
            },
            {
              start_time: unixSeconds("2026-05-31T00:00:00+09:00"),
              end_time: unixSeconds("2026-06-01T00:00:00+09:00"),
              results: [{ line_item: "Responses API", amount: { value: 9.99, currency: "usd" } }]
            }
          ],
          has_more: false,
          next_page: null
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: [
            {
              start_time: unixSeconds("2026-05-31T00:00:00+09:00"),
              end_time: unixSeconds("2026-05-31T01:00:00+09:00"),
              results: [{ line_item: "Responses API", amount: { value: 2, currency: "usd" } }]
            },
            {
              start_time: unixSeconds("2026-05-31T01:00:00+09:00"),
              end_time: unixSeconds("2026-05-31T02:00:00+09:00"),
              results: [{ line_item: "Responses API", amount: { value: 3, currency: "usd" } }]
            }
          ],
          has_more: false,
          next_page: null
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await listOpenAICostsForCurrentMonth(new Date("2026-05-31T12:00:00+09:00"));
    const dailyUrl = new URL(fetchMock.mock.calls[0][0] as string);
    const hourlyUrl = new URL(fetchMock.mock.calls[1][0] as string);

    expect(dailyUrl.searchParams.get("bucket_width")).toBe("1d");
    expect(hourlyUrl.searchParams.get("bucket_width")).toBe("1h");
    expect(dailyUrl.searchParams.getAll("api_key_ids[]")).toEqual(["key_pressnote"]);
    expect(result.costs).toEqual([
      { usage_date: "2026-05-30", cost_usd: 1.25 },
      { usage_date: "2026-05-31", cost_usd: 5 }
    ]);
    expect(result.lineItemTotals).toEqual({ "Responses API": 6.25 });
  });

  it("falls back to the daily current-day bucket when hourly costs are unavailable", async () => {
    vi.stubEnv("OPENAI_ADMIN_API_KEY", "admin-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: [
            {
              start_time: unixSeconds("2026-05-31T00:00:00+09:00"),
              end_time: unixSeconds("2026-06-01T00:00:00+09:00"),
              results: [{ line_item: "Responses API", amount: { value: 4, currency: "usd" } }]
            }
          ],
          has_more: false,
          next_page: null
        })
      )
      .mockResolvedValueOnce(jsonResponse({ error: "unsupported bucket_width" }, 400));
    vi.stubGlobal("fetch", fetchMock);

    const result = await listOpenAICostsForCurrentMonth(new Date("2026-05-31T12:00:00+09:00"));

    expect(result.available).toBe(true);
    expect(result.error).toBeNull();
    expect(result.costs).toEqual([{ usage_date: "2026-05-31", cost_usd: 4 }]);
  });
});
