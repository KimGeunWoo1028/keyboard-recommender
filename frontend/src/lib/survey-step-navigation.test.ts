import { describe, expect, it } from "vitest";

import { firstUnansweredStepIndex, selectedOptionLabel } from "@/lib/survey-step-navigation";

describe("survey-step-navigation", () => {
  it("firstUnansweredStepIndex returns first gap", () => {
    expect(
      firstUnansweredStepIndex({
        sound_profile: "muted",
        switch_feel: "linear",
        bottom_out: "soft",
        volume: "quiet",
      }),
    ).toBe(1);
  });

  it("firstUnansweredStepIndex returns last index when complete", () => {
    expect(
      firstUnansweredStepIndex({
        sound_profile: "muted",
        typing_pressure: "light",
        switch_feel: "linear",
        bottom_out: "soft",
        volume: "quiet",
      }),
    ).toBe(4);
  });

  it("selectedOptionLabel resolves option copy", () => {
    expect(selectedOptionLabel("sound_profile", "muted")).toMatch(/차분한 감쇠음/);
    expect(selectedOptionLabel("sound_profile", undefined)).toBeNull();
  });
});
