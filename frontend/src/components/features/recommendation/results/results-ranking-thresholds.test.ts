import { describe, expect, it } from "vitest";

import {
  RANKING_WHY_FIXTURES,
  rankingWhyMode,
  rankingThresholdsForDomain,
} from "./results-ranking-thresholds";

describe("results-ranking-thresholds", () => {
  it("uses scoreGapMin 0.04 for switch", () => {
    expect(rankingThresholdsForDomain("switch").scoreGapMin).toBe(0.04);
  });

  it("stable snapshot switch → fallback (honest)", () => {
    const f = RANKING_WHY_FIXTURES.switchFallback;
    expect(
      rankingWhyMode({
        domain: "switch",
        pickScore: f.pickScore,
        runnerUpScore: f.runnerUpScore,
      }),
    ).toBe(f.expectedMode);
  });

  it("synthetic large gap → concrete bullets", () => {
    const f = RANKING_WHY_FIXTURES.switchConcrete;
    expect(
      rankingWhyMode({
        domain: "switch",
        pickScore: f.pickScore,
        runnerUpScore: f.runnerUpScore,
      }),
    ).toBe(f.expectedMode);
  });

  it("no runner-up → hidden", () => {
    const f = RANKING_WHY_FIXTURES.noRunnerUp;
    expect(
      rankingWhyMode({
        domain: "switch",
        pickScore: f.pickScore,
        runnerUpScore: f.runnerUpScore,
      }),
    ).toBe(f.expectedMode);
  });

  it("non-MVP domain hidden when mvpOnly", () => {
    expect(
      rankingWhyMode({
        domain: "plate",
        pickScore: 0.5,
        runnerUpScore: 0.4,
        mvpOnly: true,
      }),
    ).toBe("hidden");
  });

  it("gap 0.02 → fallback", () => {
    const f = RANKING_WHY_FIXTURES.switchTinyGap;
    expect(
      rankingWhyMode({
        domain: "switch",
        pickScore: f.pickScore,
        runnerUpScore: f.runnerUpScore,
      }),
    ).toBe(f.expectedMode);
  });
});
