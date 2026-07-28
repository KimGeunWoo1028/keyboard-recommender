import { describe, expect, it } from "vitest";

import { emptyTraits } from "@/types/traits";
import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";

import {
  buildApiCompareRows,
  compareBuildHeadline,
  inferCompareBarsFromText,
  surveyAnswersToCompareBars,
} from "./results-compare-content";

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
  };
}

function minimalBuild(): RecommendedBuild {
  return {
    id: "test-build",
    title: "Test",
    tagline: "Tag",
    switches: "Switch",
    plate: "Plate",
    foam: "Foam",
    layout: "Layout",
    case: "Case",
    highlights: [],
    engineScores: {
      switchId: "sw-1",
      plateId: "pl-1",
      foamId: "fm-1",
      layoutId: "ly-1",
      caseId: "ca-1",
      switchScore: 0.8,
      plateScore: 0.7,
      foamScore: 0.6,
      layoutScore: 0.65,
      caseScore: 0.6,
    },
  };
}

describe("results-compare-content", () => {
  it("compareBuildHeadline uses survey sound and feel labels", () => {
    expect(compareBuildHeadline(baseSubmission().answers)).toBe("차분한 소리 · 매끈한 키감");
  });

  it("surveyAnswersToCompareBars maps five survey axes to 1–5 bars", () => {
    expect(surveyAnswersToCompareBars(baseSubmission().answers)).toEqual({
      noise: 1,
      tactile: 2,
      bottomOut: 2,
    });
  });

  it("inferCompareBarsFromText detects silent linear switches", () => {
    expect(inferCompareBarsFromText("저소음 리니어 스위치, 부드러운 바닥")).toEqual({
      noise: 1,
      tactile: 2,
      bottomOut: 2,
    });
  });

  it("buildApiCompareRows puts current build first with alternatives", () => {
    const rows = buildApiCompareRows(baseSubmission(), minimalBuild(), [
      {
        domain: "switch",
        itemId: "sw-1",
        score: 0.8,
        alternatives: [
          {
            itemId: "sw-2",
            itemName: "대안 스위치",
            score: 0.72,
            summary: "저소음 택타일 스위치입니다.",
          },
        ],
      },
    ]);

    expect(rows[0]?.isCurrent).toBe(true);
    expect(rows[0]?.matchPercent).toBe(92);
    expect(rows[1]?.name).toBe("대안 스위치");
    expect(rows[1]?.matchPercent).toBe(83);
    expect(rows.every((row) => !row.name.includes("가격"))).toBe(true);
  });
});
