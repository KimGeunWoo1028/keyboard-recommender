import { describe, expect, it } from "vitest";

import { asSurveySubmission, submissionFromSavedMetadata } from "@/lib/saved-result-snapshots";
import { emptyTraits } from "@/types/traits";
import type { SurveySubmission } from "@/types/survey";

const sampleSubmission: SurveySubmission = {
  version: 2,
  answers: {
    sound_profile: "muted",
    typing_pressure: "medium",
    switch_feel: "linear",
    bottom_out: "soft",
    volume: "quiet",
  },
  traits: emptyTraits(),
  completedAtIso: "2026-07-28T00:00:00.000Z",
  build: {
    id: "build-1",
    title: "Quiet build",
    tagline: "soft",
    switches: "A",
    plate: "B",
    foam: "C",
    layout: "65%",
    highlights: [],
  },
  source: "api",
};

describe("saved-result-snapshots server metadata", () => {
  it("accepts a valid SurveySubmission", () => {
    expect(asSurveySubmission(sampleSubmission)?.build?.id).toBe("build-1");
  });

  it("rejects invalid payloads", () => {
    expect(asSurveySubmission(null)).toBeNull();
    expect(asSurveySubmission({ version: 1 })).toBeNull();
  });

  it("reads resultSnapshot from saved metadata", () => {
    const sub = submissionFromSavedMetadata({ resultSnapshot: sampleSubmission });
    expect(sub?.answers.volume).toBe("quiet");
  });

  it("returns null when metadata has no snapshot", () => {
    expect(submissionFromSavedMetadata({ resultSnapshotId: "x" })).toBeNull();
  });
});
