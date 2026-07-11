import { describe, expect, it } from "vitest";

import { deriveQualityStatus } from "./results-quality-status";

describe("deriveQualityStatus", () => {
  it("returns null for stable high-confidence results", () => {
    expect(
      deriveQualityStatus({
        recommendationConfidence: { label: "high", overall: 0.82 },
        compatibilityAudit: { effectivePenaltyTotal: 0, summaryLines: [] },
        fallbackAudit: { recovered: false, tier: 0 },
      }),
    ).toBeNull();
  });

  it("returns null when low-confidence guidance card is active", () => {
    expect(
      deriveQualityStatus({
        confidenceGuidance: { isLowConfidence: true, shortReason: "test", followUpQuestions: [] },
        recommendationConfidence: { label: "experimental", overall: 0.4 },
      }),
    ).toBeNull();
  });

  it("shows balanced status with default detail", () => {
    const status = deriveQualityStatus({
      recommendationConfidence: { label: "balanced", overall: 0.55 },
      compatibilityAudit: { effectivePenaltyTotal: 0 },
      fallbackAudit: { recovered: false },
    });
    expect(status?.badge).toBe("무난한 추천");
    expect(status?.tone).toBe("caution");
    expect(status?.detail).toMatch(/대안/);
  });

  it("shows experimental status", () => {
    const status = deriveQualityStatus({
      recommendationConfidence: { label: "experimental", overall: 0.35 },
    });
    expect(status?.badge).toBe("참고용 추천");
    expect(status?.tone).toBe("warning");
  });

  it("returns null for minor soft penalty on high-confidence results", () => {
    expect(
      deriveQualityStatus({
        recommendationConfidence: { label: "high", overall: 0.82 },
        compatibilityAudit: {
          effectivePenaltyTotal: 0.02,
          softPenaltyCount: 1,
          summaryLines: ["1 soft compatibility penalty rule(s) were applied."],
        },
      }),
    ).toBeNull();
  });

  it("prefers Korean compatibility summary line as detail", () => {
    const status = deriveQualityStatus({
      recommendationConfidence: { label: "balanced", overall: 0.5 },
      compatibilityAudit: {
        effectivePenaltyTotal: 0.2,
        summaryLines: ["스위치와 플레이트 조합에 주의가 필요합니다."],
      },
    });
    expect(status?.detail).toBe("스위치와 플레이트 조합에 주의가 필요합니다.");
  });

  it("shows fallback recovery message", () => {
    const status = deriveQualityStatus({
      recommendationConfidence: { label: "high", overall: 0.75 },
      fallbackAudit: { recovered: true, tier: 2 },
      compatibilityAudit: { effectivePenaltyTotal: 0 },
    });
    expect(status?.badge).toBe("참고용 추천");
    expect(status?.detail).toMatch(/완화/);
  });

  it("maps noteworthy soft penalty to Korean detail", () => {
    const status = deriveQualityStatus({
      recommendationConfidence: { label: "high", overall: 0.8 },
      compatibilityAudit: {
        effectivePenaltyTotal: 0.25,
        softPenaltyCount: 1,
        summaryLines: ["1 soft compatibility penalty rule(s) were applied."],
      },
    });
    expect(status?.badge).toBe("주의가 필요한 조합");
    expect(status?.detail).toMatch(/호환성 보정/);
    expect(status?.detail).not.toMatch(/soft compatibility/i);
  });
});
