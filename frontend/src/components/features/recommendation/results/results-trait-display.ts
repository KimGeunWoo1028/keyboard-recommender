/**
 * Fixed 6-axis mini profile for the results trust layer.
 * Maps API `userTraitScores` (14 v2 axes) → 6 stable display dimensions.
 *
 * @see docs/evidence-tab-simplification-roadmap.md §「Phase 0~1 확정」
 */

/** User trait scores from the engine are typically in roughly [-8, +8]. */
export const TRAIT_DISPLAY_SCORE_MIN = -8;
export const TRAIT_DISPLAY_SCORE_MAX = 8;

export type FixedDisplayAxisId =
  | "noise"
  | "tactility"
  | "bounce"
  | "heft"
  | "flexibility"
  | "clarity";

export type FixedDisplayAxis = {
  id: FixedDisplayAxisId;
  /** Korean label shown in the mini profile */
  label: string;
  /**
   * Weighted sum of normalized v2 trait scores.
   * Negative weight = higher raw score lowers the display value.
   */
  weights: Partial<Record<string, number>>;
};

/** Order is fixed in UI — do not sort dynamically. */
export const FIXED_DISPLAY_AXES: readonly FixedDisplayAxis[] = [
  {
    id: "noise",
    label: "소음",
    weights: { muted: 1, high_pitch: -0.65, deep_sound: 0.15 },
  },
  {
    id: "tactility",
    label: "구분감",
    weights: { strong_tactile: 1, smooth: -0.55 },
  },
  {
    id: "bounce",
    label: "반발감",
    weights: { poppy: 0.75, marbly: 0.35 },
  },
  {
    id: "heft",
    label: "무게감",
    weights: { firm_bottom_out: 0.45, light_typing_force: -0.7, deep_sound: 0.25 },
  },
  {
    id: "flexibility",
    label: "탄성",
    weights: { flexible: 1, stiff: -1 },
  },
  {
    id: "clarity",
    label: "선명도",
    weights: { high_pitch: 0.55, scratchy: 0.35, smooth: -0.25 },
  },
] as const;

export const TRAIT_MINI_PROFILE_MICROCOPY =
  "당신의 취향을 대표하는 6가지 핵심 축이에요.";

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Map one engine trait score to 0–1 for bar display. */
export function normalizeTraitScore(score: number): number {
  const span = TRAIT_DISPLAY_SCORE_MAX - TRAIT_DISPLAY_SCORE_MIN;
  if (span <= 0) return 0.5;
  return clamp01((score - TRAIT_DISPLAY_SCORE_MIN) / span);
}

/**
 * Composite 0–1 value for one fixed display axis.
 * Missing traits are treated as 0 (neutral engine score).
 */
export function fixedAxisDisplayValue(
  axis: FixedDisplayAxis,
  userTraitScores: Record<string, number> | undefined,
): number {
  if (!userTraitScores) return 0.5;

  let weighted = 0;
  let weightSum = 0;
  for (const [traitId, weight] of Object.entries(axis.weights)) {
    if (weight === undefined || weight === 0) continue;
    const raw = userTraitScores[traitId] ?? 0;
    weighted += normalizeTraitScore(raw) * weight;
    weightSum += Math.abs(weight);
  }
  if (weightSum === 0) return 0.5;
  return clamp01(weighted / weightSum);
}

export type FixedAxisBar = {
  id: FixedDisplayAxisId;
  label: string;
  /** 0–1 for bar fill */
  value: number;
  /** 0–5 filled segments (5-segment bar) */
  filledSegments: number;
};

const BAR_SEGMENTS = 5;

export function fixedAxisBars(userTraitScores: Record<string, number> | undefined): FixedAxisBar[] {
  return FIXED_DISPLAY_AXES.map((axis) => {
    const value = fixedAxisDisplayValue(axis, userTraitScores);
    return {
      id: axis.id,
      label: axis.label,
      value,
      filledSegments: Math.max(0, Math.min(BAR_SEGMENTS, Math.round(value * BAR_SEGMENTS))),
    };
  });
}

export function fixedAxisBarGlyph(filledSegments: number, empty = "□", filled = "■"): string {
  const n = Math.max(0, Math.min(BAR_SEGMENTS, filledSegments));
  return filled.repeat(n) + empty.repeat(BAR_SEGMENTS - n);
}

function summaryPhrase(value: number, low: string, mid: string, high: string): string {
  if (value < 0.35) return low;
  if (value > 0.65) return high;
  return mid;
}

function fixedAxisSummaryPhrase(id: FixedDisplayAxisId, value: number): string {
  switch (id) {
    case "noise":
      return summaryPhrase(value, "조용함 선호", "보통 소음", "또렷한 소리 선호");
    case "tactility":
      return summaryPhrase(value, "매끈한 입력", "중간 구분감", "뚜렷한 구분감");
    case "bounce":
      return summaryPhrase(value, "차분한 반발", "중간 반발", "경쾌한 반발");
    case "heft":
      return summaryPhrase(value, "가벼운 타건", "중간 무게감", "묵직한 타건");
    case "flexibility":
      return summaryPhrase(value, "단단한 느낌", "중간 탄성", "탄성 있는 느낌");
    case "clarity":
      return summaryPhrase(value, "부드러운 소리", "중간 선명도", "선명한 소리");
    default:
      return "중간";
  }
}

/** Human-readable one-liner per fixed axis for mypage overview rows. */
export function fixedAxisSummaryRows(
  userTraitScores: Record<string, number> | undefined,
): { id: FixedDisplayAxisId; label: string; value: string }[] {
  return fixedAxisBars(userTraitScores).map((bar) => ({
    id: bar.id,
    label: bar.label,
    value: fixedAxisSummaryPhrase(bar.id, bar.value),
  }));
}
