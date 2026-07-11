import { describe, expect, it } from "vitest";

import { normalizeSwagkeyProductUrl, resolvePartSourceUrl, submissionMissingSwagkeyLinks, submissionHasStaleSwagkeyUrls, submissionNeedsImageUrlRefresh, submissionNeedsSwagkeyUrlRefresh } from "@/lib/swagkey-source-links";
import type { SurveySubmission } from "@/types/survey";
import { emptyTraits } from "@/types/traits";

function baseSubmission(overrides: Partial<SurveySubmission> = {}): SurveySubmission {
  return {
    version: 2,
    answers: {
      sound_profile: "muted",
      typing_pressure: "light",
      switch_feel: "linear",
      bottom_out: "soft",
      volume: "quiet",
    },
    traits: emptyTraits(),
    completedAtIso: "2026-05-01T12:00:00Z",
    source: "api",
    recommendations: [
      {
        domain: "switch",
        itemId: "sw-linear-003",
        itemName: "Peach",
        score: 0.8,
        explanation: "test",
      },
    ],
    ...overrides,
  };
}

describe("submissionMissingSwagkeyLinks", () => {
  it("returns true when API picks lack sourceUrl and build.sourceUrls", () => {
    expect(submissionMissingSwagkeyLinks(baseSubmission())).toBe(true);
  });

  it("returns false when pick already has shop_view sourceUrl", () => {
    expect(
      submissionMissingSwagkeyLinks(
        baseSubmission({
          recommendations: [
            {
              domain: "switch",
              itemId: "sw-linear-003",
              score: 0.8,
              explanation: "test",
              sourceUrl: "https://www.swagkey.kr/shop_view/?idx=1765",
            },
          ],
        }),
      ),
    ).toBe(false);
  });
});

describe("normalizeSwagkeyProductUrl", () => {
  it("rewrites category paths to shop_view", () => {
    expect(normalizeSwagkeyProductUrl("https://www.swagkey.kr/132/?idx=253")).toBe(
      "https://www.swagkey.kr/shop_view/?idx=253",
    );
  });
});

describe("submissionHasStaleSwagkeyUrls", () => {
  it("detects legacy /132/ foam URLs", () => {
    expect(
      submissionHasStaleSwagkeyUrls(
        baseSubmission({
          recommendations: [
            {
              domain: "foam",
              itemId: "foam-001",
              score: 0.8,
              explanation: "test",
              sourceUrl: "https://www.swagkey.kr/132/?idx=253",
            },
          ],
        }),
      ),
    ).toBe(true);
  });

  it("detects non-shop_view idx URLs", () => {
    expect(
      submissionHasStaleSwagkeyUrls(
        baseSubmission({
          recommendations: [
            {
              domain: "switch",
              itemId: "sw-linear-003",
              score: 0.8,
              explanation: "test",
              sourceUrl: "https://www.swagkey.kr/21/?idx=1765",
            },
          ],
        }),
      ),
    ).toBe(true);
  });
});

describe("resolvePartSourceUrl", () => {
  it("prefers nested alternative URLs over build.sourceUrls", () => {
    const url = resolvePartSourceUrl("plate", "pl-alt", {
      build: {
        id: "b",
        title: "t",
        tagline: "",
        switches: "",
        plate: "",
        foam: "",
        layout: "",
        highlights: [],
        engineScores: {
          switchId: "sw-1",
          plateId: "pl-primary",
          foamId: "fm-1",
          layoutId: "ly-1",
          caseId: "ca-1",
          switchScore: 0,
          plateScore: 0,
          foamScore: 0,
          layoutScore: 0,
          caseScore: 0,
        },
        sourceUrls: { plate: "https://www.swagkey.kr/shop_view/?idx=111" },
      },
      picks: [
        {
          domain: "plate",
          itemId: "pl-primary",
          sourceUrl: "https://www.swagkey.kr/shop_view/?idx=111",
          alternatives: [{ itemId: "pl-alt", sourceUrl: "https://www.swagkey.kr/shop_view/?idx=222" }],
        },
      ],
    });
    expect(url).toBe("https://www.swagkey.kr/shop_view/?idx=222");
  });
});

describe("submissionNeedsImageUrlRefresh", () => {
  it("flags API picks missing thumbnails including layout", () => {
    expect(
      submissionNeedsImageUrlRefresh(
        baseSubmission({
          recommendations: [
            {
              domain: "switch",
              itemId: "sw-linear-003",
              score: 0.8,
              explanation: "test",
              sourceUrl: "https://www.swagkey.kr/shop_view/?idx=1765",
            },
          ],
        }),
      ),
    ).toBe(true);
    expect(
      submissionNeedsImageUrlRefresh(
        baseSubmission({
          recommendations: [
            {
              domain: "switch",
              itemId: "sw-linear-003",
              score: 0.8,
              explanation: "test",
              imageUrl: "/media/swagkey-images/1765.jpg",
            },
            {
              domain: "layout",
              itemId: "layout-new-001-gdk-lab-dk1-tkl-기판",
              score: 0.7,
              explanation: "test",
              imageUrl: "/media/swagkey-images/1852.png",
            },
          ],
        }),
      ),
    ).toBe(false);
    expect(
      submissionNeedsImageUrlRefresh(
        baseSubmission({
          recommendations: [
            {
              domain: "layout",
              itemId: "layout-003",
              score: 0.7,
              explanation: "test",
            },
          ],
        }),
      ),
    ).toBe(true);
    expect(
      submissionNeedsImageUrlRefresh(
        baseSubmission({
          recommendations: [
            {
              domain: "layout",
              itemId: "layout-003",
              score: 0.7,
              explanation: "test",
              imageUrl: "/layout-diagrams/tkl.svg",
            },
          ],
        }),
      ),
    ).toBe(false);
  });
});

describe("submissionNeedsSwagkeyUrlRefresh", () => {
  it("combines missing and stale checks", () => {
    expect(submissionNeedsSwagkeyUrlRefresh(baseSubmission())).toBe(true);
    expect(
      submissionNeedsSwagkeyUrlRefresh(
        baseSubmission({
          recommendations: [
            {
              domain: "switch",
              itemId: "sw-linear-003",
              score: 0.8,
              explanation: "test",
              sourceUrl: "https://www.swagkey.kr/shop_view/?idx=1765",
            },
          ],
        }),
      ),
    ).toBe(false);
  });
});
