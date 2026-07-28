import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SurveyWizard } from "@/components/features/recommendation/survey-wizard";
import { clearSurveyWizardDraft } from "@/lib/survey-wizard-draft";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("SurveyWizard preset skip (Phase 3)", () => {
  beforeEach(() => {
    clearSurveyWizardDraft();
  });
  it("jumps to first unanswered step after style preset", async () => {
    const user = userEvent.setup();
    render(<SurveyWizard />);

    await user.click(screen.getByRole("button", { name: /부드럽고 조용한 성향/ }));
    await user.click(screen.getByTestId("e2e-survey-start-with-style"));

    expect(screen.getByRole("heading", { name: "타건 압력" })).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 5 문항/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "선호 사운드 성향" })).not.toBeInTheDocument();
  });

  it("shows prefilled banner on seeded steps after advancing", async () => {
    const user = userEvent.setup();
    render(<SurveyWizard />);

    await user.click(screen.getByRole("button", { name: /부드럽고 조용한 성향/ }));
    await user.click(screen.getByTestId("e2e-survey-start-with-style"));
    await user.click(screen.getByRole("radio", { name: /가볍게 누름/ }));
    await user.click(screen.getByRole("button", { name: "다음" }));

    const banner = screen.getByTestId("e2e-prefilled-step-banner");
    expect(banner).toBeInTheDocument();
    expect(within(banner).getByText(/매끈한 입력감/)).toBeInTheDocument();
  });
});
