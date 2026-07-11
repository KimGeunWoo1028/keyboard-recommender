import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RecommendedBuild } from "@/types/recommendation";

import { ResultsEvidencePickCard } from "./results-evidence-pick-card";
import { RANKING_WHY_FIXTURES } from "./results-ranking-thresholds";

const ALIGNMENT_TRAITS = [
  "차분한 감쇠음 선호(+8.0)와 후보 특성(+10.0)이 같은 방향이라 정합 기여가 큽니다(+84.0).",
  "매끈한 타건감 선호(+5.0)와 후보 특성(+9.2)이 같은 방향이라 정합 기여가 큽니다(+55.2).",
];

function minimalBuild(): RecommendedBuild {
  return {
    id: "b1",
    title: "Test",
    tagline: "Tag",
    switches: "s",
    plate: "p",
    foam: "f",
    layout: "l",
    case: "c",
    highlights: [],
    engineScores: {
      switchId: "sw-1",
      plateId: "pl-1",
      foamId: "fm-1",
      layoutId: "ly-1",
      caseId: "ca-1",
      switchScore: 0.7,
      plateScore: 0.6,
      foamScore: 0.5,
      layoutScore: 0.5,
      caseScore: 0.5,
    },
  };
}

describe("ResultsEvidencePickCard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders why line and hides tradeoff when tradeOffs empty", () => {
    render(
      <ResultsEvidencePickCard
        row={{
          domain: "plate",
          itemId: "pl-1",
          itemName: "Test plate",
          score: 0.5,
          explanation: "가중 기여 축 요약: muted (+1.0).",
          summary: "Test plate은(는) FR4 소재 플레이트입니다.",
          whyTraits: ["FR4 소재입니다."],
          tradeOffs: [],
        }}
        index={1}
        build={minimalBuild()}
        apiPicks={[]}
        enrichedSourceUrls={{}}
      />,
    );

    expect(screen.getByText("왜 추천했나요")).toBeInTheDocument();
    expect(screen.getByTestId("e2e-pick-product-specs")).toBeInTheDocument();
    expect(screen.getByText("FR4 소재입니다.")).toBeInTheDocument();
    expect(screen.queryByTestId("e2e-pick-tradeoff")).not.toBeInTheDocument();
    expect(screen.queryByText("특별히 주의할")).not.toBeInTheDocument();
    expect(screen.queryByTestId("e2e-pick-ranking-why")).not.toBeInTheDocument();
    expect(screen.queryByText("1순위로 선택한 이유")).not.toBeInTheDocument();
    expect(screen.queryByText("순위 점수")).not.toBeInTheDocument();
    expect(screen.queryByText(/유사도 \d+%/)).not.toBeInTheDocument();
  });

  it("shows tradeoff block only when tradeOffs exist", () => {
    render(
      <ResultsEvidencePickCard
        row={{
          domain: "switch",
          itemId: "sw-1",
          itemName: "Test switch",
          score: 0.8,
          explanation: "가중 기여 축 요약: muted (+1.0).",
          summary: "Test summary",
          whyTraits: [],
          tradeOffs: [
            "구분감 있는 키감 축은 트레이드오프가 있습니다. 이 축의 가중 일치도가 상대적으로 낮아(-7.0), 핵심 선호 축 대비 체감이 덜 맞을 수 있습니다.",
          ],
        }}
        index={0}
        build={minimalBuild()}
        apiPicks={[]}
        enrichedSourceUrls={{}}
      />,
    );

    expect(screen.getByTestId("e2e-pick-tradeoff")).toBeInTheDocument();
    expect(screen.getByText("주의할 점")).toBeInTheDocument();
  });

  it("shows product specs in collapsed details without engine audit", () => {
    render(
      <ResultsEvidencePickCard
        row={{
          domain: "switch",
          itemId: "sw-1",
          itemName: "Switch A",
          score: 0.8,
          explanation: "가중 기여 축 요약: muted (+84.00); smooth (+55.20).",
          summary: "Switch summary",
          whyTraits: [
            "중간 무게의 스프링(44g) 설정입니다.",
            "팩토리 윤활이 적용되어 마찰감을 줄인 세팅입니다.",
            "차분한 감쇠음 선호(+8.0)와 후보 특성(+10.0)이 같은 방향이라 정합 기여가 큽니다(+84.0).",
          ],
        }}
        index={0}
        build={minimalBuild()}
        apiPicks={[]}
        enrichedSourceUrls={{}}
      />,
    );

    expect(screen.getByTestId("e2e-pick-product-specs")).toBeInTheDocument();
    expect(screen.getByText("제품 특징")).toBeInTheDocument();
    expect(screen.getByText("팩토리 윤활이 적용되어 마찰감을 줄인 세팅입니다.")).toBeInTheDocument();
    expect(screen.queryByText("점수에 영향을 준 항목")).not.toBeInTheDocument();
    expect(screen.queryByText(/정합 기여/)).not.toBeInTheDocument();
    expect(screen.queryByText("왜 잘 맞는지")).not.toBeInTheDocument();
  });

  it("hides details when only engine audit traits exist", () => {
    render(
      <ResultsEvidencePickCard
        row={{
          domain: "switch",
          itemId: "sw-1",
          itemName: "Switch A",
          score: 0.8,
          explanation: "가중 기여 축 요약: muted (+84.00).",
          summary: "Switch summary",
          whyTraits: [
            "차분한 감쇠음 선호(+8.0)와 후보 특성(+10.0)이 같은 방향이라 정합 기여가 큽니다(+84.0).",
          ],
        }}
        index={0}
        build={minimalBuild()}
        apiPicks={[]}
        enrichedSourceUrls={{}}
      />,
    );

    expect(screen.queryByTestId("e2e-pick-product-specs")).not.toBeInTheDocument();
    expect(screen.queryByText("점수에 영향을 준 항목")).not.toBeInTheDocument();
  });

  it("does not render alternative summary text", () => {
    render(
      <ResultsEvidencePickCard
        row={{
          domain: "switch",
          itemId: "sw-1",
          itemName: "Switch A",
          score: 0.8,
          explanation: "",
          summary: "Main",
          alternatives: [{ itemId: "sw-2", score: 0.7, summary: "Alt long engine summary should be hidden" }],
        }}
        index={0}
        build={minimalBuild()}
        apiPicks={[]}
        enrichedSourceUrls={{}}
      />,
    );

    expect(screen.queryByText("Alt long engine summary should be hidden")).not.toBeInTheDocument();
  });

  it("shows ranking-why bullets when switch gap is concrete", () => {
    const f = RANKING_WHY_FIXTURES.switchConcrete;
    render(
      <ResultsEvidencePickCard
        row={{
          domain: "switch",
          itemId: "sw-1",
          itemName: "Switch A",
          score: f.pickScore,
          explanation: "",
          summary: "Switch summary",
          whyTraits: ALIGNMENT_TRAITS,
          alternatives: [{ itemId: "sw-2", score: f.runnerUpScore, summary: "Alt" }],
        }}
        index={0}
        build={minimalBuild()}
        apiPicks={[]}
        enrichedSourceUrls={{}}
      />,
    );

    expect(screen.getByTestId("e2e-pick-ranking-why")).toBeInTheDocument();
    expect(screen.getByText("1순위로 선택한 이유")).toBeInTheDocument();
    expect(screen.getByText(/선호하는 차분한 감쇠음/)).toBeInTheDocument();
  });

  it("hides ranking-why UI on fallback gap (trust layer carries uncertainty)", () => {
    const f = RANKING_WHY_FIXTURES.switchFallback;
    render(
      <ResultsEvidencePickCard
        row={{
          domain: "switch",
          itemId: "sw-1",
          itemName: "Switch A",
          score: f.pickScore,
          explanation: "",
          summary: "Switch summary",
          whyTraits: ALIGNMENT_TRAITS,
          alternatives: [{ itemId: "sw-2", score: f.runnerUpScore, summary: "Alt" }],
        }}
        index={0}
        build={minimalBuild()}
        apiPicks={[]}
        enrichedSourceUrls={{}}
      />,
    );

    expect(screen.queryByTestId("e2e-pick-ranking-why")).not.toBeInTheDocument();
    expect(screen.queryByText("상위 후보가 매우 비슷해요")).not.toBeInTheDocument();
  });

  it("hides ranking-why when NEXT_PUBLIC_EVIDENCE_RANKING_WHY=0", () => {
    vi.stubEnv("NEXT_PUBLIC_EVIDENCE_RANKING_WHY", "0");
    const f = RANKING_WHY_FIXTURES.switchConcrete;
    render(
      <ResultsEvidencePickCard
        row={{
          domain: "switch",
          itemId: "sw-1",
          itemName: "Switch A",
          score: f.pickScore,
          explanation: "",
          summary: "Switch summary",
          whyTraits: ALIGNMENT_TRAITS,
          alternatives: [{ itemId: "sw-2", score: f.runnerUpScore, summary: "Alt" }],
        }}
        index={0}
        build={minimalBuild()}
        apiPicks={[]}
        enrichedSourceUrls={{}}
      />,
    );

    expect(screen.queryByTestId("e2e-pick-ranking-why")).not.toBeInTheDocument();
  });
});
