import { describe, expect, it } from "vitest";
import { getNextCheckTimeLabel } from "@/lib/check-schedule";

describe("check schedule", () => {
  it("returns the next crawl check time from the daily schedule", () => {
    expect(getNextCheckTimeLabel(new Date("2026-06-02T05:59:00+09:00"))).toBe("06:00");
    expect(getNextCheckTimeLabel(new Date("2026-06-02T12:01:00+09:00"))).toBe("18:00");
    expect(getNextCheckTimeLabel(new Date("2026-06-02T03:01:00Z"))).toBe("18:00");
    expect(getNextCheckTimeLabel(new Date("2026-06-02T18:01:00+09:00"))).toBe("06:00");
  });
});
