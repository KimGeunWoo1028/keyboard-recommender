import { describe, expect, it } from "vitest";

import { authEntryContext, authLoginContextCopy, safeAuthNextPath } from "@/lib/auth-next";

describe("safeAuthNextPath", () => {
  it("allows relative app paths", () => {
    expect(safeAuthNextPath("/results")).toBe("/results");
    expect(safeAuthNextPath("/mypage?section=saved")).toBe("/mypage?section=saved");
  });

  it("blocks open redirects", () => {
    expect(safeAuthNextPath("//evil.example")).toBe("/results");
    expect(safeAuthNextPath("https://evil.example")).toBe("/results");
    expect(safeAuthNextPath("/\\evil")).toBe("/results");
    expect(safeAuthNextPath(null)).toBe("/results");
  });
});

describe("authEntryContext", () => {
  it("maps next paths to login copy context", () => {
    expect(authEntryContext("/results")).toBe("results_save");
    expect(authEntryContext("/mypage?section=saved")).toBe("mypage");
    expect(authEntryContext("/recommend")).toBe("recommend");
    expect(authEntryContext("/catalog")).toBe("generic");
    expect(authLoginContextCopy("results_save").body).toMatch(/계정에 저장/);
  });
});
