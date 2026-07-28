import { describe, expect, it } from "vitest";

import { emptyTraits } from "@/types/traits";
import type { SurveySubmission } from "@/types/survey";

import {
  buildEvidenceMatchCallout,
  evidenceMatchRowsFromSubmission,
} from "./results-evidence-match-content";

function baseSubmission(): SurveySubmission {
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
    overallConfidence: 0.92,
    recommendationConfidence: { overall: 0.92, label: "high", hooks: [] },
  };
}

describe("evidenceMatchRowsFromSubmission", () => {
  it("maps five survey axes to Manus-style labels", () => {
    expect(evidenceMatchRowsFromSubmission(baseSubmission().answers)).toEqual([
      { label: "소리 취향", value: "차분한 소리", match: true },
      { label: "입력 강도", value: "가벼운 입력", match: true },
      { label: "타건감", value: "매끈한 키감", match: true },
      { label: "바닥감", value: "부드러운 바닥감", match: true },
      { label: "소음 민감도", value: "조용한 편", match: true },
    ]);
  });
});

describe("buildEvidenceMatchCallout", () => {
  it("uses overall confidence and survey-only copy", () => {
    const callout = buildEvidenceMatchCallout(baseSubmission(), []);
    expect(callout.percent).toBe(92);
    expect(callout.title).toBe("추천 신뢰도 92%");
    expect(callout.body).toContain("설문 응답 5개 항목");
    expect(callout.body).toContain("설문에서 고른 방향이 고르게 반영됐어요.");
    expect(callout.body).not.toMatch(/예산|레이아웃/);
  });
});
