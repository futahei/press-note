import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildAnalyticsPagePath, getGoogleAnalyticsMeasurementId } from "@/lib/analytics";

describe("analytics", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a GA4 measurement id only when it has the expected format", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", " G-ABC123DEF4 ");
    expect(getGoogleAnalyticsMeasurementId()).toBe("G-ABC123DEF4");

    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "UA-123456-1");
    expect(getGoogleAnalyticsMeasurementId()).toBeNull();
  });

  it("builds page paths with query strings", () => {
    expect(buildAnalyticsPagePath("/articles", new URLSearchParams("q=robot&page=2"))).toBe(
      "/articles?q=robot&page=2"
    );
    expect(buildAnalyticsPagePath("/terms", new URLSearchParams())).toBe("/terms");
  });
});
