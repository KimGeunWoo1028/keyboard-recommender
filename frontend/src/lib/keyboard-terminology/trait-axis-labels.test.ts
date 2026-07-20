import { describe, expect, it } from "vitest";

import { CANONICAL_TRAIT_AXIS_IDS, isCanonicalTraitAxis, traitAxisDisplayLabel, traitAxisHelpHint } from "./trait-axis-labels";

describe("keyboard-terminology trait axis labels", () => {
  it("covers 100% of canonical trait axes with Korean-only labels", () => {
    for (const axis of CANONICAL_TRAIT_AXIS_IDS) {
      expect(isCanonicalTraitAxis(axis)).toBe(true);
      const label = traitAxisDisplayLabel(axis);
      expect(label).not.toBe(axis);
      expect(label.length).toBeGreaterThan(2);
      expect(/[가-힣]/.test(label)).toBe(true);
      expect(label).not.toMatch(/[A-Za-z]/);
    }
  });

  it("provides HelpHint copy for catalog-grade axes without English jargon", () => {
    const withHints = ["deep_sound", "high_pitch", "smooth", "tactile_strength", "soft_bottom_out", "loudness"];
    for (const axis of withHints) {
      const hint = traitAxisHelpHint(axis);
      expect(hint?.length).toBeGreaterThan(10);
      expect(hint).not.toMatch(/\b(Thocky|Clacky|Linear|Tactile|Muted|Poppy)\b/i);
    }
  });

  it("falls back gracefully for unknown axes", () => {
    expect(traitAxisDisplayLabel("unknown_axis_id")).toBe("기타 성향");
  });
});
