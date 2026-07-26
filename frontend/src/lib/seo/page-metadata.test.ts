import { describe, expect, it } from "vitest";

import { normalizeSeoPath, privatePageMetadata, publicPageMetadata } from "@/lib/seo/page-metadata";

describe("normalizeSeoPath", () => {
  it("keeps root as /", () => {
    expect(normalizeSeoPath("/")).toBe("/");
    expect(normalizeSeoPath("")).toBe("/");
  });

  it("strips trailing slashes on non-root paths", () => {
    expect(normalizeSeoPath("/recommend/")).toBe("/recommend");
    expect(normalizeSeoPath("catalog")).toBe("/catalog");
  });
});

describe("page metadata helpers", () => {
  it("sets self-canonical and OG url for public pages", () => {
    const meta = publicPageMetadata({
      path: "/catalog",
      title: "키보드 부품 둘러보기",
      description: "desc",
    });
    expect(meta.alternates).toEqual({ canonical: "/catalog" });
    expect(meta.openGraph?.url).toBe("/catalog");
    expect(meta.robots).toBeUndefined();
  });

  it("sets noindex and self-canonical for private pages", () => {
    const meta = privatePageMetadata({
      path: "/results",
      title: "추천 결과",
      description: "개인 결과",
    });
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.alternates).toEqual({ canonical: "/results" });
    expect(meta.openGraph?.url).toBe("/results");
  });
});
