import { describe, expect, it } from "vitest";

import { deriveConfidenceStory } from "./results-confidence-story-content";
import { formatBuildHighlights } from "./results-build-highlights-content";

describe("deriveConfidenceStory", () => {
  it("returns high tier bullets for stable high confidence", () => {
    const story = deriveConfidenceStory(
      {
        recommendationConfidence: { label: "high", overall: 0.82 },
        compatibilityAudit: { effectivePenaltyTotal: 0 },
        fallbackAudit: { recovered: false },
      },
      [{ domain: "switch", itemId: "sw-1", score: 0.8, explanation: "" }],
    );
    expect(story?.headline).toBe("설문 맞춤: 높은 편");
    expect(story?.bullets.some((b) => b.text.includes("일관"))).toBe(true);
    expect(story?.bullets.some((b) => b.text.includes("더 잘 맞는"))).toBe(true);
  });

  it("uses 보통 tier when runner-up gap is small", () => {
    const story = deriveConfidenceStory(
      {
        recommendationConfidence: { label: "high", overall: 0.82 },
        compatibilityAudit: { effectivePenaltyTotal: 0 },
        fallbackAudit: { recovered: false },
      },
      [
        {
          domain: "switch",
          itemId: "sw-1",
          score: 0.644,
          explanation: "",
          alternatives: [{ itemId: "sw-2", score: 0.636, summary: "alt" }],
        },
      ],
    );
    expect(story?.headline).toBe("설문 맞춤: 보통");
    expect(story?.bullets.some((b) => b.text.includes("비슷"))).toBe(true);
  });

  it("includes refine actions for low-confidence guidance", () => {
    const story = deriveConfidenceStory(
      {
        confidenceGuidance: {
          isLowConfidence: true,
          shortReason: "응답이 엇갈렸어요",
          followUpQuestions: [],
          actions: [{ label: "조용한 쪽으로", stepId: "volume", answerId: "quiet" }],
        },
        recommendationConfidence: { label: "experimental", overall: 0.4 },
      },
      [],
    );
    expect(story?.headline).toBe("설문 맞춤: 보통");
    expect(story?.refineActions).toHaveLength(1);
  });

  it("returns 참고용 tier for experimental confidence", () => {
    const story = deriveConfidenceStory(
      {
        recommendationConfidence: { label: "experimental", overall: 0.45 },
        fallbackAudit: { recovered: false },
        compatibilityAudit: { effectivePenaltyTotal: 0 },
      },
      [{ domain: "switch", itemId: "sw-1", score: 0.8, explanation: "" }],
    );
    expect(story?.headline).toBe("설문 맞춤: 참고용");
    expect(story?.bullets.some((b) => /참고|비슷/.test(b.text))).toBe(true);
  });

  it("returns balanced tier when label is balanced even with sufficient gap", () => {
    const story = deriveConfidenceStory(
      {
        recommendationConfidence: { label: "balanced", overall: 0.62 },
        compatibilityAudit: { effectivePenaltyTotal: 0 },
        fallbackAudit: { recovered: false },
      },
      [
        {
          domain: "switch",
          itemId: "sw-1",
          score: 0.72,
          explanation: "",
          alternatives: [{ itemId: "sw-2", score: 0.62, summary: "alt" }],
        },
      ],
    );
    expect(story?.headline).toBe("설문 맞춤: 보통");
    expect(story?.bullets.some((b) => b.text.includes("엇갈렸"))).toBe(true);
  });
});

describe("formatBuildHighlights", () => {
  it("filters engine debug lines and limits to two bullets", () => {
    expect(
      formatBuildHighlights([
        "추천 엔진 v2 — switch 0.643",
        "묵직한 저음",
        "부드러운 바닥감",
        "구분감 있는 입력감",
      ]),
    ).toEqual(["묵직한 저음", "부드러운 바닥감"]);
  });

  it("filters stable snapshot engine highlights entirely", () => {
    expect(
      formatBuildHighlights([
        "추천 엔진 v2 — 스위치 0.644 (스웨그키 HMX Peach 반저소음 리니어 키보드 스위치)",
        "플레이트 0.455 · 폼 0.606 · 레이아웃 0.396 · 케이스 0.446 · 키캡 0.460",
        "주요 성향 축: deep_sound 0.0, muted 8.0, soft_bottom_out 8.0, smooth 5.0",
        "다양성 재정렬: 성향 다양성을 위해 대안 후보 순서를 조정했습니다. (1순위는 유지)",
        "추천 신뢰도: high (78%)",
      ]),
    ).toEqual([]);
  });

  it("filters compatibility and operational audit lines from API highlights", () => {
    expect(
      formatBuildHighlights([
        "호환성 요약: 1 soft compatibility penalty rule(s) were applied.",
        "운영 자동화 메모: operational automation disabled",
        "호환성 보정: 1개 규칙 적용; 유효 페널티 0.050 (의도 가중치 1.00).",
        "안정 복구 모드 (단계 0): …",
        "묵직한 저음 중심 조합",
      ]),
    ).toEqual(["묵직한 저음 중심 조합"]);
  });
});
