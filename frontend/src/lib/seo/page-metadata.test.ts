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
    expect(meta.openGraph?.images).toEqual([
      {
        url: "/og/default.png",
        width: 1200,
        height: 630,
        alt: "Keyboard Recommender",
      },
    ]);
    expect(meta.robots).toBeUndefined();
  });

  it("sets noindex and self-canonical for private pages", () => {
    const meta = privatePageMetadata({
      path: "/auth/forgot-password",
      title: "비밀번호 재설정",
      description: "Keyboard Recommender 계정의 비밀번호 재설정 링크를 요청합니다.",
    });
    expect(meta.title).toBe("비밀번호 재설정");
    expect(meta.description).toBe(
      "Keyboard Recommender 계정의 비밀번호 재설정 링크를 요청합니다.",
    );
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.alternates).toEqual({ canonical: "/auth/forgot-password" });
    expect(meta.openGraph?.url).toBe("/auth/forgot-password");
  });
});
