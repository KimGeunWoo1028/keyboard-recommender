import { describe, expect, it } from "vitest";

import { formatAbsoluteDate, getCopyrightYear, parseDateTime } from "@/lib/date-time";

describe("date-time helpers", () => {
  it("parses timezone-less API timestamps as UTC", () => {
    const parsed = parseDateTime("2026-07-21T15:30:00");
    expect(parsed?.toISOString()).toBe("2026-07-21T15:30:00.000Z");
  });

  it("formats absolute dates in Asia/Seoul", () => {
    expect(formatAbsoluteDate("2026-07-21T15:30:00Z")).toMatch(/2026년 7월 22일/);
  });

  it("uses Seoul calendar year for copyright copy", () => {
    expect(getCopyrightYear("2026-01-01T15:00:00Z")).toBe(2026);
    expect(getCopyrightYear("2025-12-31T15:00:00Z")).toBe(2026);
  });
});
