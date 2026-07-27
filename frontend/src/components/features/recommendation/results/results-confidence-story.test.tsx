"use client";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ResultsConfidenceStory } from "./results-confidence-story";

describe("ResultsConfidenceStory", () => {
  it("shows a one-line summary and keeps details behind an accessible accordion", async () => {
    const user = userEvent.setup();
    render(
      <ResultsConfidenceStory
        submission={{
          recommendationConfidence: { label: "high", overall: 0.82 },
          compatibilityAudit: { effectivePenaltyTotal: 0 },
          fallbackAudit: { recovered: false },
        } as never}
        apiPicks={[{ domain: "switch", itemId: "sw-1", score: 0.8, explanation: "" }]}
      />,
    );

    expect(screen.getByTestId("e2e-confidence-story")).toBeInTheDocument();
    expect(screen.getByText("설문에서 고른 방향이 고르게 반영됐어요.")).toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "추천 기준 자세히 보기" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("취향 반영도 · 잘 맞음")).not.toBeVisible();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("취향 반영도 · 잘 맞음")).toBeVisible();
    expect(screen.getByRole("button", { name: "추천 기준 접기" })).toBeInTheDocument();
  });
});
