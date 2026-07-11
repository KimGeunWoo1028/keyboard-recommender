import { describe, expect, it } from "vitest";

import { CANONICAL_TRAIT_AXIS_IDS, isCanonicalTraitAxis, traitAxisDisplayLabel, traitAxisHelpHint } from "./trait-axis-labels";

describe("keyboard-terminology trait axis labels", () => {
  it("covers 100% of canonical trait axes with Korean labels", () => {
    for (const axis of CANONICAL_TRAIT_AXIS_IDS) {
      expect(isCanonicalTraitAxis(axis)).toBe(true);
      const label = traitAxisDisplayLabel(axis);
      expect(label).not.toBe(axis);
      expect(label.length).toBeGreaterThan(2);
      expect(/[가-힣]/.test(label)).toBe(true);
    }
  });

  it("provides HelpHint copy for catalog-grade axes", () => {
    const withHints = ["deep_sound", "high_pitch", "smooth", "tactile_strength", "soft_bottom_out", "loudness"];
    for (const axis of withHints) {
      expect(traitAxisHelpHint(axis)?.length).toBeGreaterThan(10);
    }
  });

  it("falls back gracefully for unknown axes", () => {
    expect(traitAxisDisplayLabel("unknown_axis_id")).toBe("unknown axis id");
  });
});
