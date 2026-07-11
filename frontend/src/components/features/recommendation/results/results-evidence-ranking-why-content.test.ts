import { describe, expect, it } from "vitest";

import { formatEvidenceRankingWhy } from "./results-evidence-ranking-why-content";
import { RANKING_WHY_FIXTURES } from "./results-ranking-thresholds";

const STABLE_SWITCH_WHY_TRAITS = [
  "중간 무게의 스프링(44g) 설정입니다.",
  "차분한 감쇠음 선호(+8.0)와 후보 특성(+10.0)이 같은 방향이라 정합 기여가 큽니다(+84.0).",
  "매끈한 타건감 선호(+5.0)와 후보 특성(+9.2)이 같은 방향이라 정합 기여가 큽니다(+55.2).",
];

describe("formatEvidenceRankingWhy", () => {
  it("stable snapshot switch gap → fallback model (UI hidden; trust layer carries message)", () => {
    const f = RANKING_WHY_FIXTURES.switchFallback;
    const model = formatEvidenceRankingWhy({
      domain: "switch",
      pickScore: f.pickScore,
      runnerUpScore: f.runnerUpScore,
      whyTraits: STABLE_SWITCH_WHY_TRAITS,
    });
    expect(model.mode).toBe("fallback");
    expect(model.bullets).toHaveLength(0);
    expect(model.title).toBe("상위 후보가 매우 비슷해요");
  });

  it("gap 0.02 → fallback (no concrete comparison)", () => {
    const f = RANKING_WHY_FIXTURES.switchTinyGap;
    const model = formatEvidenceRankingWhy({
      domain: "switch",
      pickScore: f.pickScore,
      runnerUpScore: f.runnerUpScore,
      whyTraits: STABLE_SWITCH_WHY_TRAITS,
    });
    expect(model.mode).toBe("fallback");
    expect(model.bullets).toHaveLength(0);
  });

  it("large gap → at most two concrete bullets from top traits", () => {
    const f = RANKING_WHY_FIXTURES.switchConcrete;
    const model = formatEvidenceRankingWhy({
      domain: "switch",
      pickScore: f.pickScore,
      runnerUpScore: f.runnerUpScore,
      whyTraits: STABLE_SWITCH_WHY_TRAITS,
    });
    expect(model.mode).toBe("concrete");
    expect(model.bullets.length).toBeGreaterThan(0);
    expect(model.bullets.length).toBeLessThanOrEqual(2);
    expect(model.bullets[0]).toContain("차분한 감쇠음");
  });

  it("hides when runner-up missing", () => {
    const f = RANKING_WHY_FIXTURES.noRunnerUp;
    const model = formatEvidenceRankingWhy({
      domain: "switch",
      pickScore: f.pickScore,
      runnerUpScore: f.runnerUpScore,
    });
    expect(model.mode).toBe("hidden");
  });
});
