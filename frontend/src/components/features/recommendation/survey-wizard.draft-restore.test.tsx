import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SurveyWizard } from "@/components/features/recommendation/survey-wizard";
import { clearSurveyWizardDraft } from "@/lib/survey-wizard-draft";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("SurveyWizard draft restore (SUR-01 / SUR-02)", () => {
  beforeEach(() => {
    clearSurveyWizardDraft();
  });

  it("restores mid-wizard after remount (refresh / back from results)", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SurveyWizard />);
    await user.click(screen.getByRole("button", { name: /부드럽고 조용한 성향/ }));
    expect(screen.getByRole("heading", { name: "타건 압력" })).toBeInTheDocument();
    unmount();
    // Simulate /results → browser back: remount with draft intact (submit must not clear).
    render(<SurveyWizard />);
    expect(screen.getByRole("heading", { name: "타건 압력" })).toBeInTheDocument();
    expect(screen.queryByText("취향에 맞는 키보드 찾기")).not.toBeInTheDocument();
  });
});
