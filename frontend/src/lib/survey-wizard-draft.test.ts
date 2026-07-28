import { describe, expect, it, beforeEach, vi } from "vitest";

import {
  clearSurveyWizardDraft,
  installSurveyNavPopListener,
  isBrowserBackNavigation,
  loadSurveyWizardDraft,
  saveSurveyWizardDraft,
} from "@/lib/survey-wizard-draft";

describe("survey-wizard-draft", () => {
  beforeEach(() => {
    clearSurveyWizardDraft();
    sessionStorage.removeItem("kr_survey_nav_pop_v1");
    vi.restoreAllMocks();
    delete (window as Window & { __krSurveyNavPopInstalled?: boolean }).__krSurveyNavPopInstalled;
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

  it("round-trips completedForResults", () => {
    saveSurveyWizardDraft({
      phase: "questions",
      stepIndex: 4,
      answers: {},
      selectedStyle: null,
      seededStepIds: [],
      nlPreferenceText: "",
      completedForResults: true,
    });
    expect(loadSurveyWizardDraft()?.completedForResults).toBe(true);
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

  it("detects browser back via popstate flag", () => {
    installSurveyNavPopListener();
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(isBrowserBackNavigation()).toBe(true);
    // Consumed — second read is false unless Timing says back_forward.
    vi.spyOn(window.performance, "getEntriesByType").mockReturnValue([
      { type: "navigate" } as PerformanceNavigationTiming,
    ]);
    expect(isBrowserBackNavigation()).toBe(false);
  });

  it("falls back to Navigation Timing back_forward", () => {
    vi.spyOn(window.performance, "getEntriesByType").mockReturnValue([
      { type: "back_forward" } as PerformanceNavigationTiming,
    ]);
    expect(isBrowserBackNavigation()).toBe(true);
  });
});
