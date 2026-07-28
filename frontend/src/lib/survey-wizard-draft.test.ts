import { describe, expect, it, beforeEach } from "vitest";

import {
  clearSurveyWizardDraft,
  loadSurveyWizardDraft,
  saveSurveyWizardDraft,
} from "@/lib/survey-wizard-draft";

describe("survey-wizard-draft", () => {
  beforeEach(() => {
    clearSurveyWizardDraft();
  });

  it("round-trips a mid-wizard draft", () => {
    saveSurveyWizardDraft({
      phase: "questions",
      stepIndex: 2,
      answers: { sound_profile: "muted", volume: "quiet" },
      selectedStyle: "creamy_quiet",
      seededStepIds: ["sound_profile", "volume"],
      nlPreferenceText: "",
    });
    const loaded = loadSurveyWizardDraft();
    expect(loaded?.phase).toBe("questions");
    expect(loaded?.stepIndex).toBe(2);
    expect(loaded?.answers.sound_profile).toBe("muted");
    expect(loaded?.selectedStyle).toBe("creamy_quiet");
    expect(loaded?.seededStepIds).toEqual(["sound_profile", "volume"]);
  });

  it("clears draft", () => {
    saveSurveyWizardDraft({
      phase: "questions",
      stepIndex: 0,
      answers: {},
      selectedStyle: null,
      seededStepIds: [],
      nlPreferenceText: "",
    });
    clearSurveyWizardDraft();
    expect(loadSurveyWizardDraft()).toBeNull();
  });
});
