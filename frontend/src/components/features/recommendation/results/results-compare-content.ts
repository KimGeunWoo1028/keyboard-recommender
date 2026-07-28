import type { SurveySubmission } from "@/types/survey";
import type { RecommendedBuild } from "@/types/recommendation";
import type { CatalogItem, ScoredComponent } from "@/recommendation-engine/models";
import type { TraitMetadata } from "@/recommendation-engine/traits";

import { DISPLAY_K } from "./results-constants";
import { alternativeTagline } from "./results-text-utils";

export type CompareAxisBars = {
  noise: number;
  tactile: number;
  bottomOut: number;
};

export type CompareBuildRow = {
  id: string;
  name: string;
  matchPercent: number | null;
  isCurrent: boolean;
  bars: CompareAxisBars;
};

export const COMPARE_AXIS_LABELS = {
  noise: "소음",
  tactile: "타건감",
  bottomOut: "바닥감",
} as const;

const SOUND_LABEL: Record<SurveySubmission["answers"]["sound_profile"], string> = {
  thocky: "묵직한 저음",
  clacky: "또렷한 고음",
  muted: "차분한 소리",
  balanced: "균형형 사운드",
  bright: "밝고 생동감 있는 고음",
};
const FEEL_LABEL: Record<SurveySubmission["answers"]["switch_feel"], string> = {
  linear: "매끈한 키감",
  tactile_light: "은은한 구분감",
  tactile_clear: "뚜렷한 구분감",
};

type ApiAlternative = {
  itemId: string;
  itemName?: string;
  score: number;
  description?: string;
  summary: string;
};

type ApiPick = {
  domain: string;
  itemId: string;
  itemName?: string;
  score?: number;
  summary?: string;
  alternatives?: ApiAlternative[];
};

function clampBar(value: number): number {
  if (!Number.isFinite(value)) return 3;
  return Math.max(1, Math.min(5, Math.round(value)));
}

export function compareBuildHeadline(answers: SurveySubmission["answers"]): string {
  return `${SOUND_LABEL[answers.sound_profile]} · ${FEEL_LABEL[answers.switch_feel]}`;
}

export function surveyAnswersToCompareBars(answers: SurveySubmission["answers"]): CompareAxisBars {
  const volumeToNoise = { quiet: 1, moderate: 3, loud: 5 } as const;
  const feelToTactile = { linear: 2, tactile_light: 3, tactile_clear: 5 } as const;
  const bottomToBar = { soft: 2, medium: 3, firm: 5 } as const;
  return {
    noise: volumeToNoise[answers.volume],
    tactile: feelToTactile[answers.switch_feel],
    bottomOut: bottomToBar[answers.bottom_out],
  };
}

function resolveMatchPercent(submission: SurveySubmission): number | null {
  if (typeof submission.overallConfidence === "number" && Number.isFinite(submission.overallConfidence)) {
    return Math.round(submission.overallConfidence * 100);
  }
  const overall = submission.recommendationConfidence?.overall;
  if (typeof overall === "number" && Number.isFinite(overall)) {
    return Math.round(overall * 100);
  }
  return null;
}

function scaledAlternativeMatch(
  currentMatch: number | null,
  pickScore: number | undefined,
  altScore: number,
): number | null {
  if (currentMatch !== null && typeof pickScore === "number" && pickScore > 0) {
    return Math.max(1, Math.min(99, Math.round((currentMatch * altScore) / pickScore)));
  }
  if (Number.isFinite(altScore)) {
    return Math.max(1, Math.min(99, Math.round(altScore * 100)));
  }
  return null;
}

/** Infer 1–5 bars from catalog/engine text (no invented price axis). */
export function inferCompareBarsFromText(text: string): CompareAxisBars {
  const sample = text.trim();
  let noise = 3;
  let tactile = 3;
  let bottomOut = 3;

  if (/저소음|무소음|silent|조용|muted/i.test(sample)) noise = 1;
  else if (/클릭|clicky|청축|clacky|큰 소리|loud/i.test(sample)) noise = 5;
  else if (/차분|muted|thock/i.test(sample)) noise = 2;

  if (/리니어|linear|매끈|smooth/i.test(sample)) tactile = 2;
  else if (/택타일|tactile|갈축|구분감|tactile_clear/i.test(sample)) tactile = 5;
  else if (/은은한|tactile_light/i.test(sample)) tactile = 3;

  if (/부드|soft|푹신|soft bottom/i.test(sample)) bottomOut = 2;
  else if (/단단|firm|묵직|hard bottom/i.test(sample)) bottomOut = 5;
  else if (/중간 바닥|medium bottom/i.test(sample)) bottomOut = 3;

  return { noise, tactile, bottomOut };
}

export function traitMetadataToCompareBars(meta: TraitMetadata): CompareAxisBars {
  const clacky = meta.clacky ?? 5;
  const soft = meta.soft ?? 5;
  const tactile = meta.tactile_strength ?? 5;
  return {
    noise: clampBar(clacky / 2),
    tactile: clampBar(tactile / 2),
    bottomOut: clampBar(soft / 2),
  };
}

function collectSwitchAlternatives(apiPicks: ApiPick[], limit: number): ApiAlternative[] {
  const switchPick = apiPicks.find((pick) => pick.domain.toLowerCase() === "switch");
  return (switchPick?.alternatives ?? []).slice(0, limit);
}

function collectOtherAlternatives(apiPicks: ApiPick[], limit: number, excludeIds: Set<string>): ApiAlternative[] {
  const rows: ApiAlternative[] = [];
  for (const pick of apiPicks) {
    for (const alt of pick.alternatives ?? []) {
      const key = `${pick.domain}:${alt.itemId}`;
      if (excludeIds.has(key)) continue;
      rows.push(alt);
      if (rows.length >= limit) return rows;
    }
  }
  return rows;
}

/** API results — current build + up to two switch/other alternatives. */
export function buildApiCompareRows(
  submission: SurveySubmission,
  _build: RecommendedBuild,
  apiPicks: ApiPick[],
): CompareBuildRow[] {
  const currentMatch = resolveMatchPercent(submission);
  const rows: CompareBuildRow[] = [
    {
      id: "current",
      name: compareBuildHeadline(submission.answers),
      matchPercent: currentMatch,
      isCurrent: true,
      bars: surveyAnswersToCompareBars(submission.answers),
    },
  ];

  const switchPick = apiPicks.find((pick) => pick.domain.toLowerCase() === "switch");
  const switchAlts = collectSwitchAlternatives(apiPicks, 2);
  const used = new Set<string>();

  for (const [idx, alt] of switchAlts.entries()) {
    used.add(`switch:${alt.itemId}`);
    const text = `${alt.summary} ${alt.description ?? ""} ${alt.itemName ?? ""}`;
    rows.push({
      id: `alt-switch-${alt.itemId}`,
      name: alt.itemName?.trim() || alternativeTagline(idx),
      matchPercent: scaledAlternativeMatch(currentMatch, switchPick?.score, alt.score),
      isCurrent: false,
      bars: inferCompareBarsFromText(text),
    });
  }

  if (rows.length < 3) {
    const extras = collectOtherAlternatives(apiPicks, 3 - rows.length, used);
    for (const [idx, alt] of extras.entries()) {
      const text = `${alt.summary} ${alt.description ?? ""} ${alt.itemName ?? ""}`;
      rows.push({
        id: `alt-extra-${alt.itemId}-${idx}`,
        name: alt.itemName?.trim() || alternativeTagline(idx + switchAlts.length),
        matchPercent: Math.max(1, Math.min(99, Math.round(alt.score * 100))),
        isCurrent: false,
        bars: inferCompareBarsFromText(text),
      });
    }
  }

  return rows.slice(0, 3);
}

/** Lite/local engine — headline + top switch candidates as variants. */
export function buildLiteCompareRows(
  submission: SurveySubmission,
  switches: ScoredComponent<CatalogItem>[],
): CompareBuildRow[] {
  const currentMatch = resolveMatchPercent(submission);
  const rows: CompareBuildRow[] = [
    {
      id: "current",
      name: compareBuildHeadline(submission.answers),
      matchPercent: currentMatch,
      isCurrent: true,
      bars: surveyAnswersToCompareBars(submission.answers),
    },
  ];

  const topPickScore = switches[0]?.score;
  for (const [idx, row] of switches.slice(1, DISPLAY_K).entries()) {
    rows.push({
      id: `lite-switch-${row.item.id}`,
      name: row.item.name,
      matchPercent: scaledAlternativeMatch(currentMatch, topPickScore, row.score),
      isCurrent: false,
      bars: traitMetadataToCompareBars(row.item.traitMetadata),
    });
  }

  return rows.slice(0, 3);
}
