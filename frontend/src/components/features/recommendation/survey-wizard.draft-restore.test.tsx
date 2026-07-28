import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SurveyWizard } from "@/components/features/recommendation/survey-wizard";
import {
  clearSurveyWizardDraft,
  saveSurveyWizardDraft,
} from "@/lib/survey-wizard-draft";
import type { SurveyStepId } from "@/types/survey";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const completedDraft = {
  phase: "questions" as const,
  stepIndex: 4,
  answers: {
    sound_profile: "muted" as const,
    volume: "quiet" as const,
    typing_pressure: "light" as const,
    travel_preference: "short" as const,
    weight_preference: "light" as const,
  },
  selectedStyle: "creamy_quiet" as const,
  seededStepIds: ["sound_profile", "volume"] as SurveyStepId[],
  nlPreferenceText: "",
  completedForResults: true,
};

describe("SurveyWizard draft restore (SUR-01 / SUR-02)", () => {
  beforeEach(() => {
    clearSurveyWizardDraft();
    sessionStorage.removeItem("kr_survey_nav_pop_v1");
    vi.restoreAllMocks();
    vi.spyOn(window.performance, "getEntriesByType").mockReturnValue([
      { type: "navigate" } as PerformanceNavigationTiming,
    ]);
  });

  it("restores mid-wizard after remount (refresh / incomplete draft)", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SurveyWizard />);
    await user.click(screen.getByRole("button", { name: /부드럽고 조용한 성향/ }));
    await user.click(screen.getByTestId("e2e-survey-start-with-style"));
    expect(screen.getByRole("heading", { name: "타건 압력" })).toBeInTheDocument();
    unmount();
    render(<SurveyWizard />);
    expect(screen.getByRole("heading", { name: "타건 압력" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "취향에 맞는 키보드 찾기" })).toBeInTheDocument();
  });

  it("restores last step on browser back after results (completed draft)", () => {
    saveSurveyWizardDraft(completedDraft);
    sessionStorage.setItem("kr_survey_nav_pop_v1", "1");

    render(<SurveyWizard />);

    expect(screen.queryByText("나의 타건 성향은?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "결과 보기" })).toBeInTheDocument();
  });

  it("starts at entry when opening survey tab after results (completed draft)", () => {
    saveSurveyWizardDraft(completedDraft);

    render(<SurveyWizard />);

    expect(screen.getByText("나의 타건 성향은?")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "결과 보기" })).not.toBeInTheDocument();
  });
});
