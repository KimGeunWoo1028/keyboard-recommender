import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SurveyWizard } from "@/components/features/recommendation/survey-wizard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("SurveyWizard entry (Phase 1 — no quick recommendation)", () => {
  it("shows style presets without quick-recommend UI", () => {
    render(<SurveyWizard />);

    expect(screen.getByText("취향에 맞는 키보드 찾기")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /부드럽고 조용한 성향/ })).toBeInTheDocument();
    expect(screen.queryByText("빠른 추천 받기")).not.toBeInTheDocument();
    expect(screen.queryByText(/빠른 추천 \(약 10초\)/)).not.toBeInTheDocument();
  });
});
