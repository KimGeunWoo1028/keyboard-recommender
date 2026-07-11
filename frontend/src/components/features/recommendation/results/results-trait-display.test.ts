import { describe, expect, it } from "vitest";

import {
  FIXED_DISPLAY_AXES,
  fixedAxisBars,
  fixedAxisBarGlyph,
  normalizeTraitScore,
  TRAIT_MINI_PROFILE_MICROCOPY,
} from "./results-trait-display";

describe("results-trait-display", () => {
  const stableMutedUser: Record<string, number> = {
    muted: 8,
    high_pitch: -3,
    smooth: 5,
    strong_tactile: -2,
    soft_bottom_out: 8,
    firm_bottom_out: -1,
    light_typing_force: 4,
    flexible: 0,
    stiff: 0,
    poppy: 0,
    marbly: 0,
    scratchy: 0,
    deep_sound: 0,
  };

  it("exposes six fixed axes in stable order", () => {
    expect(FIXED_DISPLAY_AXES.map((a) => a.label)).toEqual([
      "소음",
      "구분감",
      "반발감",
      "무게감",
      "탄성",
      "선명도",
    ]);
  });

  it("has mini profile microcopy", () => {
    expect(TRAIT_MINI_PROFILE_MICROCOPY).toContain("6가지");
  });

  it("normalizes trait scores to 0–1", () => {
    expect(normalizeTraitScore(-8)).toBe(0);
    expect(normalizeTraitScore(8)).toBe(1);
    expect(normalizeTraitScore(0)).toBeCloseTo(0.5);
  });

  it("ranks quiet preference high for muted-heavy profile", () => {
    const bars = fixedAxisBars(stableMutedUser);
    const noise = bars.find((b) => b.id === "noise");
    const clarity = bars.find((b) => b.id === "clarity");
    expect(noise).toBeDefined();
    expect(clarity).toBeDefined();
    expect(noise!.filledSegments).toBeGreaterThan(clarity!.filledSegments);
  });

  it("renders five-segment bar glyphs", () => {
    expect(fixedAxisBarGlyph(3)).toBe("■■■□□");
    expect(fixedAxisBarGlyph(0)).toBe("□□□□□");
    expect(fixedAxisBarGlyph(5)).toBe("■■■■■");
  });
});
