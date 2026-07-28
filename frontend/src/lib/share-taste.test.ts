import { describe, expect, it } from "vitest";

import { buildShareUrl, decodeShareTaste, encodeShareTaste } from "@/lib/share-taste";

describe("share-taste (SHR-01)", () => {
  it("round-trips non-PII taste payload", () => {
    const payload = {
      v: 1 as const,
      title: "차분한 소리 · 매끈한 키감",
      tags: ["조용한 편", "차분한 소리"],
      why: "설문에서 고른 방향이 고르게 반영됐어요.",
    };
    const token = encodeShareTaste(payload);
    expect(token).not.toMatch(/[+/=]/);
    expect(decodeShareTaste(token)).toEqual(payload);
  });

  it("builds share URL without PII keys", () => {
    const url = buildShareUrl("https://example.com", {
      v: 1,
      title: "테스트",
      tags: ["조용한 편"],
    });
    expect(url).toMatch(/^https:\/\/example\.com\/share\?t=/);
    expect(url.toLowerCase()).not.toContain("email");
    expect(url.toLowerCase()).not.toContain("user");
  });
});
