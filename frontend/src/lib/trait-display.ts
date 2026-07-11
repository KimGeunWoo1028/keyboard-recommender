import type { TraitAccumulator } from "@/types/traits";

const LABELS: Record<keyof TraitAccumulator, string> = {
  soundMuted: "Muted / dampened",
  soundBright: "Bright / lively",
  soundThocky: "Thocky",
  soundClacky: "Clacky",
  volumeQuiet: "Quiet",
  volumeLoud: "Loud",
  linearLean: "Linear-leaning",
  tactileLean: "Tactile-leaning",
  softBottom: "Soft bottom-out",
  firmBottom: "Firm bottom-out",
  lightPress: "Light typing pressure",
  heavyPress: "Heavy typing pressure",
};

export type TraitHighlight = { key: keyof TraitAccumulator; score: number; label: string };

/** Top positive trait scores for result badges (derived from survey deltas). */
export function topTraitHighlights(traits: TraitAccumulator, max = 8): TraitHighlight[] {
  return (Object.entries(traits) as [keyof TraitAccumulator, number][])
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([key, score]) => ({ key, score, label: LABELS[key] }));
}
