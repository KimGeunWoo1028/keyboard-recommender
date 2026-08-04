import { describe, expect, it, beforeEach } from "vitest";

import { readStoredResult } from "@/components/features/recommendation/results-view";
import { saveSurveySubmission } from "@/lib/survey-storage";
import { emptyTraits } from "@/types/traits";
import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";

function minimalBuild(): RecommendedBuild {
  return {
    id: "build-stable-1",
    title: "Test combination",
    tagline: "Tag",
    switches: "Switch line",
    plate: "Plate line",
    foam: "Foam line",
    layout: "Layout line",
    case: "Case line",
    highlights: ["Highlight one"],
    engineScores: {
      switchId: "sw-1",
      plateId: "pl-1",
      foamId: "fm-1",
      layoutId: "ly-1",
      caseId: "ca-1",
      switchScore: 0.7,
      plateScore: 0.6,
      foamScore: 0.5,
      layoutScore: 0.55,
      caseScore: 0.5,
    },
  };
}

function sampleSubmission(): SurveySubmission {
  return {
    version: 2,
    answers: {
      sound_profile: "thocky",
      typing_pressure: "medium",
      switch_feel: "linear",
      bottom_out: "medium",
      volume: "moderate",
    },
    traits: emptyTraits(),
    completedAtIso: "2026-08-04T00:00:00.000Z",
    source: "local",
    build: minimalBuild(),
  };
}

describe("readStoredResult snapshot stability", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("returns the same object reference when stored data is unchanged", () => {
    saveSurveySubmission(sampleSubmission());
    const a = readStoredResult();
    const b = readStoredResult();
    expect(a).toBe(b);
    expect(a.submission?.completedAtIso).toBe("2026-08-04T00:00:00.000Z");
    expect(a.build?.id).toBe("build-stable-1");
  });
});
