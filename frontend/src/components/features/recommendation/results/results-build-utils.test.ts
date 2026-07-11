import { describe, expect, it } from "vitest";

import { pickRowSourceUrl } from "@/components/features/recommendation/results/results-build-utils";
import { resolvePartSourceUrl } from "@/lib/swagkey-source-links";
import type { RecommendedBuild } from "@/types/recommendation";

function minimalBuild(overrides: Partial<RecommendedBuild> = {}): RecommendedBuild {
  return {
    id: "build-1",
    title: "Test",
    tagline: "Tag",
    switches: "Primary Switch",
    plate: "Primary Plate",
    foam: "Primary Foam",
    layout: "Layout",
    highlights: [],
    engineScores: {
      switchId: "sw-primary",
      plateId: "pl-primary",
      foamId: "fm-primary",
      layoutId: "ly-1",
      caseId: "ca-1",
      switchScore: 0.8,
      plateScore: 0.7,
      foamScore: 0.6,
      layoutScore: 0.5,
      caseScore: 0.5,
    },
    sourceUrls: {
      switch: "https://www.swagkey.kr/shop_view/?idx=100",
      plate: "https://www.swagkey.kr/shop_view/?idx=200",
      foam: "https://www.swagkey.kr/shop_view/?idx=300",
    },
    ...overrides,
  };
}

describe("alternative Swagkey links", () => {
  const build = minimalBuild();
  const picks = [
    {
      domain: "switch",
      itemId: "sw-primary",
      sourceUrl: "https://www.swagkey.kr/shop_view/?idx=100",
      alternatives: [
        {
          itemId: "sw-alt",
          sourceUrl: "https://www.swagkey.kr/shop_view/?idx=999",
        },
      ],
    },
  ];

  it("uses the alternative sourceUrl instead of the primary build URL", () => {
    expect(
      pickRowSourceUrl(
        { domain: "switch", itemId: "sw-alt", sourceUrl: "https://www.swagkey.kr/shop_view/?idx=999" },
        build,
        picks,
        {},
      ),
    ).toBe("https://www.swagkey.kr/shop_view/?idx=999");
  });

  it("does not fall back to build.sourceUrls when itemId is an alternative", () => {
    expect(resolvePartSourceUrl("switch", "sw-alt", { build, picks, enrichedUrls: {} })).toBe(
      "https://www.swagkey.kr/shop_view/?idx=999",
    );
  });

  it("still uses build.sourceUrls for the primary pick", () => {
    expect(resolvePartSourceUrl("switch", "sw-primary", { build, picks, enrichedUrls: {} })).toBe(
      "https://www.swagkey.kr/shop_view/?idx=100",
    );
  });

  it("resolves layout alternative urls from parent pick alternatives", () => {
    const layoutPicks = [
      {
        domain: "layout",
        itemId: "layout-new-001-gdk-lab-dk1-tkl-기판",
        sourceUrl: "https://www.swagkey.kr/shop_view/?idx=1852",
        alternatives: [
          { itemId: "layout-003", sourceUrl: "https://www.swagkey.kr/shop_view/?idx=1852" },
          { itemId: "layout-004", sourceUrl: "https://www.swagkey.kr/shop_view/?idx=1604" },
        ],
      },
    ];
    expect(
      pickRowSourceUrl({ domain: "layout", itemId: "layout-003" }, build, layoutPicks, {}),
    ).toBe("https://www.swagkey.kr/shop_view/?idx=1852");
    expect(
      pickRowSourceUrl({ domain: "layout", itemId: "layout-004" }, build, layoutPicks, {}),
    ).toBe("https://www.swagkey.kr/shop_view/?idx=1604");
  });
});
