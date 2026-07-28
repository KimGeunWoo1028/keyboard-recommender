import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecommendationResultView } from "@/components/features/recommendation/recommendation-result-view";
import { emptyTraits } from "@/types/traits";
import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";

function minimalBuild(): RecommendedBuild {
  return {
    id: "test-build",
    title: "Test combination",
    tagline: "Tag",
    switches: "Switch line",
    plate: "Plate line",
    foam: "Foam line",
    layout: "Layout line",
    case: "Case line",
    highlights: ["Highlight one"],
    engineScores: {
      switchId: "sw-1",
      plateId: "pl-1",
      foamId: "fm-1",
      layoutId: "ly-1",
      caseId: "ca-1",
      switchScore: 0.7,
      plateScore: 0.6,
      foamScore: 0.5,
      layoutScore: 0.55,
      caseScore: 0.5,
    },
  };
}

function minimalSubmission(): SurveySubmission {
  return {
    version: 2,
    answers: {
      sound_profile: "muted",
      typing_pressure: "light",
      switch_feel: "linear",
      bottom_out: "soft",
      volume: "quiet",
    },
    traits: emptyTraits(),
    completedAtIso: "2026-05-01T12:00:00Z",
    source: "api",
    build: minimalBuild(),
    recommendations: [
      {
        domain: "switch",
        itemId: "sw-1",
        itemName: "Example switch",
        score: 0.8,
        explanation: "Test explanation for weighted axes.",
        summary: "Strong match",
        whyTraits: ["smooth"],
        tradeOffs: [],
        confidence: 0.77,
      },
    ],
    matchExplanations: [
      {
        domain: "switch",
        itemId: "sw-1",
        itemName: "Example switch",
        score: 0.8,
        explanation: "Test explanation for weighted axes.",
        summary: "Strong match",
        whyTraits: ["smooth"],
        tradeOffs: [],
        confidence: 0.77,
      },
    ],
    overallConfidence: 0.76,
    compatibilityAudit: {
      effectivePenaltyTotal: 0,
      lines: [],
      intentMultiplier: 1,
      rawPenaltyTotal: 0,
      hasHardIncompatibility: false,
      hardIncompatibilityCount: 0,
      softPenaltyCount: 0,
      warningCount: 0,
      summaryLines: [],
    },
    recommendationConfidence: { overall: 0.8, label: "high", hooks: [] },
  };
}

describe("RecommendationResultView", () => {
  it("renders minimal overview: parts grid, contextual CTA band, retake in shell", () => {
    const sub = minimalSubmission();
    const build = minimalBuild();
    render(<RecommendationResultView submission={sub} build={build} />);

    expect(screen.getByTestId("e2e-server-ranked")).toBeInTheDocument();
    expect(screen.getByTestId("e2e-overview-cta-band")).toBeInTheDocument();
    expect(screen.getByTestId("e2e-save-login-link")).toBeInTheDocument();
    expect(screen.getByTestId("e2e-results-retake-link")).toBeInTheDocument();
    expect(screen.queryByTestId("e2e-overview-footer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("e2e-trust-layer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("e2e-confidence-story")).not.toBeInTheDocument();
    expect(screen.queryByTestId("e2e-results-next-actions")).not.toBeInTheDocument();
    expect(screen.getByTestId("e2e-trust-short-why")).toHaveTextContent(
      "설문에서 고른 방향이 고르게 반영됐어요.",
    );
    expect(screen.queryByTestId("e2e-quality-status")).not.toBeInTheDocument();
    expect(screen.getByText("차분한 소리 · 매끈한 키감")).toBeInTheDocument();
    expect(screen.queryByText("Test combination")).not.toBeInTheDocument();
    expect(screen.getByText(/점수는 구매 만족이나 품질 보증이 아니라/)).toBeInTheDocument();

    const ranked = screen.getByTestId("e2e-server-ranked");
    const cta = screen.getByTestId("e2e-overview-cta-band");
    const save = screen.getByTestId("e2e-save-build");
    expect(save.compareDocumentPosition(ranked) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(ranked.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows one-line quality status when recommendation is not fully stable", () => {
    const sub = {
      ...minimalSubmission(),
      recommendationConfidence: { overall: 0.5, label: "balanced", hooks: [] },
    };
    render(<RecommendationResultView submission={sub} build={minimalBuild()} />);

    expect(screen.getByTestId("e2e-trust-short-why")).toHaveTextContent(
      "일부 선호가 서로 달라 가장 잘 맞는 균형형 조합을 추천했어요.",
    );
    expect(screen.queryByTestId("e2e-quality-status")).not.toBeInTheDocument();
  });
});
