import { describe, expect, it } from "vitest";

/**
 * Phase 4 Observe inventory — keep in sync with
 * `docs/product-next-phase4-launch.md` §2 and emit call sites.
 * Compare Drawer events must stay absent from the active UI set.
 */
export const PHASE4_ACTIVE_OBSERVE_EVENTS = [
  "interaction.bookmark",
  "interaction.results_tab_click",
  "interaction.click",
  "interaction.revisit",
  "interaction.repeated_view",
  "interaction.refinement",
  "kpi.time_to_first_result",
] as const;

export const PHASE4_RETIRED_COMPARE_EVENTS = [
  "interaction.drawer_open",
  "interaction.comparison",
] as const;

describe("Phase 4 observe event inventory", () => {
  it("keeps bookmark and results_tab_click as primary funnel signals", () => {
    expect(PHASE4_ACTIVE_OBSERVE_EVENTS).toContain("interaction.bookmark");
    expect(PHASE4_ACTIVE_OBSERVE_EVENTS).toContain("interaction.results_tab_click");
  });

  it("does not treat Compare Drawer events as active UI observe signals", () => {
    for (const retired of PHASE4_RETIRED_COMPARE_EVENTS) {
      expect(PHASE4_ACTIVE_OBSERVE_EVENTS).not.toContain(retired);
    }
  });
});
