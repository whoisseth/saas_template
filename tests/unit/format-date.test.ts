import { describe, it, expect } from "vitest";
import { formatDate } from "@/lib/utils";

describe("formatDate", () => {
  it("formats ISO string into human-readable date", () => {
    expect(formatDate("2026-10-08T13:36:49.000Z")).toBe("October 8, 2026");
  });

  it("formats Date object into human-readable date", () => {
    const d = new Date(Date.UTC(2026, 9, 8));
    expect(formatDate(d)).toBe("October 8, 2026");
  });

  it("recovers from 1000x multiplier timestamp overflow where year exceeds 3000", () => {
    // 1791466609000 seconds -> year 58739 instead of 2026
    const badTimestampIso = new Date(1791466609000 * 1000).toISOString();
    expect(formatDate(badTimestampIso)).toBe("October 8, 2026");
  });

  it("handles custom formatting options", () => {
    expect(formatDate("2026-10-08T13:36:49.000Z", { month: "short", day: "numeric", year: "numeric" })).toBe("Oct 8, 2026");
  });

  it("returns empty string for invalid date", () => {
    expect(formatDate("invalid-date")).toBe("");
  });
});
