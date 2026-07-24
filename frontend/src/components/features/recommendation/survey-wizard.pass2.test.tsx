import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SurveyWizard } from "@/components/features/recommendation/survey-wizard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("SurveyWizard Pass 2 (action hierarchy · NL · loading copy)", () => {
  it("hides secondary reset actions until details is opened", async () => {
    const user = userEvent.setup();
    render(<SurveyWizard />);

    await user.click(screen.getByRole("button", { name: /부드럽고 조용한 성향/ }));

    expect(screen.getByRole("button", { name: "다음" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "스타일 선택으로" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "처음부터 다시" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "설정 다시 고르기" }));
    expect(screen.getByRole("button", { name: "스타일 선택으로" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "처음부터 다시" })).toBeInTheDocument();
  });

  it("shows optional NL preference only on the last step", async () => {
    const user = userEvent.setup();
    render(<SurveyWizard />);

    await user.click(screen.getByRole("button", { name: /부드럽고 조용한 성향/ }));
    expect(screen.queryByTestId("e2e-nl-preference")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /가볍게 누름/ }));
    // creamy_quiet seeds 4/5; after answering typing_pressure, advance through prefilled steps.
    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(screen.queryByTestId("e2e-nl-preference")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(screen.queryByTestId("e2e-nl-preference")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다음" }));

    expect(screen.getByText("추가로 알려주기 (선택)")).toBeInTheDocument();
    await user.click(screen.getByText("추가로 알려주기 (선택)"));
    expect(screen.getByTestId("e2e-nl-preference")).toBeVisible();
    expect(screen.getByRole("button", { name: "결과 보기" })).toBeInTheDocument();
    expect(screen.getByText(/취향 요약, 추천 조합/)).toBeInTheDocument();
  });

  it("offers a full-survey path without choosing a style", async () => {
    const user = userEvent.setup();
    render(<SurveyWizard />);

    await user.click(screen.getByRole("button", { name: "성향 없이 전체 설문으로 시작" }));
    expect(screen.getByRole("heading", { name: "선호 사운드 성향" })).toBeInTheDocument();
    expect(screen.queryByTestId("e2e-prefilled-step-banner")).not.toBeInTheDocument();
  });
});
