import type { TraitAccumulator } from "@/types/traits";
import { surveyTraitDisplayLabel } from "@/lib/keyboard-terminology";

export type TraitHighlight = { key: keyof TraitAccumulator; score: number; label: string };

/** Top positive trait scores for result badges (derived from survey deltas). */
export function topTraitHighlights(traits: TraitAccumulator, max = 8): TraitHighlight[] {
  return (Object.entries(traits) as [keyof TraitAccumulator, number][])
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([key, score]) => ({ key, score, label: surveyTraitDisplayLabel(key) }));
}
