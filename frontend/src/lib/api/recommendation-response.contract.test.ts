import { describe, expect, it } from "vitest";

import { parseRecommendationApiResponse } from "@/lib/api/recommendation-response";

/** Minimal compute-shaped payload (mirrors backend contract tests). */
function minimalComputePayload() {
  const pick = {
    domain: "switch",
    itemId: "sw-linear-003",
    itemName: "Test switch",
    score: 0.82,
    explanation: "Aligned with linear preference.",
    summary: "Strong linear match",
    whyTraits: ["smooth"],
    tradeOffs: [],
    confidence: 0.75,
    sourceUrl: "https://www.swagkey.kr/21/?idx=1765",
    imageUrl: "/media/swagkey-images/1765.jpg",
  };
  return {
    answers: {
      sound_profile: "muted",
      typing_pressure: "light",
      switch_feel: "linear",
      bottom_out: "soft",
      volume: "quiet",
    },
    legacyTraits: {},
    userVector: { warm: 0.5, bright: 0.1, smooth: 0.2, tactile: 0.1, quiet: 0.3, firm: 0.1 },
    userTraitScores: { smooth: 0.6, muted: 0.5 },
    traitAxes: ["smooth", "muted"],
    recommendations: [pick],
    matchExplanations: [pick],
    overallConfidence: 0.76,
    build: {
      id: "engine-sw-linear-003-plate-004",
      title: "T",
      tagline: "G",
      switches: "S",
      plate: "P",
      foam: "F",
      layout: "L",
      case: "C",
      keycap: "K",
      highlights: [],
      engineScores: {
        switchId: "sw-linear-003",
        plateId: "plate-004",
        foamId: "foam-005",
        layoutId: "layout-003",
        caseId: "case-001",
        keycapId: "keycap-001",
        switchScore: 0.64,
        plateScore: 0.45,
        foamScore: 0.6,
        layoutScore: 0.39,
        caseScore: 0.42,
        keycapScore: 0.41,
      },
      sourceUrls: {
        switch: "https://www.swagkey.kr/21/?idx=1765",
        plate: "https://www.swagkey.kr/22/?idx=100",
        foam: "",
        layout: "",
        case: "",
        keycap: "",
      },
    },
    completedAtIso: "2026-05-01T12:00:00Z",
    nlPreferenceAnalysis: {
      applied: false,
      normalizedText: "",
      parsingConfidence: 0,
      matchedTermIds: [],
      unknownTokens: [],
      warnings: [],
    },
    compatibilityAudit: {
      intentMultiplier: 1,
      rawPenaltyTotal: 0,
      effectivePenaltyTotal: 0,
      lines: [],
      hasHardIncompatibility: false,
      hardIncompatibilityCount: 0,
      softPenaltyCount: 0,
      warningCount: 0,
      summaryLines: [],
    },
    diversityAudit: { families: [] },
    fallbackAudit: {
      recovered: false,
      tier: 0,
      compatibilityRelaxMult: 1,
      diversityStrengthMult: 1,
      triggers: [],
      confidenceBefore: 0.7,
      confidenceAfter: 0.72,
      overallLabel: "ok",
      notes: [],
    },
    recommendationConfidence: {
      overall: 0.79,
      similarityComponent: 0.4,
      compatibilityComponent: 0.35,
      diversityDistortionComponent: 0.04,
      fallbackTier: 0,
      label: "high",
      hooks: [],
    },
  };
}

describe("parseRecommendationApiResponse", () => {
  it("accepts a full compute payload and preserves audit + confidence objects", () => {
    const raw = minimalComputePayload();
    const out = parseRecommendationApiResponse(raw);

    expect(out.recommendations).toHaveLength(1);
    expect(out.recommendations[0]?.sourceUrl).toBe("https://www.swagkey.kr/shop_view/?idx=1765");
    expect(out.recommendations[0]?.imageUrl).toBe("/media/swagkey-images/1765.jpg");
    expect(out.build.sourceUrls?.switch).toBe("https://www.swagkey.kr/shop_view/?idx=1765");
    expect(out.matchExplanations).toEqual(out.recommendations);
    expect(out.compatibilityAudit?.effectivePenaltyTotal).toBe(0);
    expect(out.recommendationConfidence?.overall).toBeCloseTo(0.79, 5);
    expect(out.recommendationConfidence?.label).toBe("high");
  });

  it("fails fast when userVector is missing (UI regression guard)", () => {
    const raw = minimalComputePayload();
    // @ts-expect-error intentional bad fixture
    delete raw.userVector;
    expect(() => parseRecommendationApiResponse(raw)).toThrow(/userVector/);
  });
});
