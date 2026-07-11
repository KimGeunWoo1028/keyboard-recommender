/**
 * Ranking-why gap thresholds (pick score vs same-domain runner-up).
 *
 * @see docs/evidence-tab-simplification-roadmap.md §「Phase 0~1 확정」
 */

export type RankingDomain =
  | "switch"
  | "plate"
  | "case"
  | "keycap"
  | "layout"
  | "stabilizer";

export type RankingGapThresholds = {
  /** Absolute score gap (pick.score - runnerUp.score) for concrete ranking bullets. */
  scoreGapMin: number;
  /**
   * Reserved for Phase 3-2+ when catalog trait vectors are available on alternatives.
   * MVP uses score gap only.
   */
  traitGapMin: number | null;
};

const DEFAULT_THRESHOLDS: RankingGapThresholds = {
  scoreGapMin: 0.04,
  traitGapMin: null,
};

/**
 * Calibrated against `stable_recommendation.snapshot.json`:
 * - switch pick vs alt1: gap ≈ 0.008 → fallback
 * - layout pick vs alt2: gap ≈ 0.045 → bullet (when domain enabled)
 */
export const RANKING_GAP_THRESHOLDS: Record<RankingDomain, RankingGapThresholds> = {
  switch: { scoreGapMin: 0.04, traitGapMin: null },
  plate: { scoreGapMin: 0.04, traitGapMin: null },
  case: { scoreGapMin: 0.04, traitGapMin: null },
  keycap: { scoreGapMin: 0.04, traitGapMin: null },
  layout: { scoreGapMin: 0.04, traitGapMin: null },
  stabilizer: { scoreGapMin: 0.04, traitGapMin: null },
};

/** Domains that render ranking-why in MVP (Task 3-2). */
export const RANKING_WHY_MVP_DOMAINS: readonly RankingDomain[] = ["switch"];

export function rankingThresholdsForDomain(domain: string): RankingGapThresholds {
  const key = domain as RankingDomain;
  return RANKING_GAP_THRESHOLDS[key] ?? DEFAULT_THRESHOLDS;
}

export function pickRunnerUpScoreGap(pickScore: number, runnerUpScore: number): number {
  return pickScore - runnerUpScore;
}

export type RankingWhyMode = "concrete" | "fallback" | "hidden";

export function rankingWhyMode(args: {
  domain: string;
  pickScore: number;
  runnerUpScore: number | undefined;
  mvpOnly?: boolean;
}): RankingWhyMode {
  const { domain, pickScore, runnerUpScore, mvpOnly = true } = args;

  if (mvpOnly && !RANKING_WHY_MVP_DOMAINS.includes(domain as RankingDomain)) {
    return "hidden";
  }
  if (runnerUpScore === undefined || Number.isNaN(runnerUpScore)) {
    return "hidden";
  }

  const gap = pickRunnerUpScoreGap(pickScore, runnerUpScore);
  const { scoreGapMin } = rankingThresholdsForDomain(domain);
  return gap >= scoreGapMin ? "concrete" : "fallback";
}

/** Fixture references for tests (stable snapshot + synthetic). */
export const RANKING_WHY_FIXTURES = {
  /** stable_recommendation.snapshot.json — switch domain */
  switchFallback: {
    pickScore: 0.6443857559589444,
    runnerUpScore: 0.6359576517748767,
    expectedMode: "fallback" as const,
  },
  /** Synthetic — gap large enough for concrete bullets */
  switchConcrete: {
    pickScore: 0.72,
    runnerUpScore: 0.62,
    expectedMode: "concrete" as const,
  },
  /** gap 0.02 — must stay fallback (PR quick check) */
  switchTinyGap: {
    pickScore: 0.72,
    runnerUpScore: 0.7,
    expectedMode: "fallback" as const,
  },
  noRunnerUp: {
    pickScore: 0.65,
    runnerUpScore: undefined,
    expectedMode: "hidden" as const,
  },
} as const;

export const RANKING_WHY_FALLBACK_COPY = {
  title: "상위 후보가 매우 비슷해요",
  body: "취향 차이에 따라 2순위도 충분히 좋은 선택일 수 있어요",
} as const;
