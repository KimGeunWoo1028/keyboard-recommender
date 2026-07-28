import type { SurveySubmission } from "@/types/survey";
import type { RecommendedBuild } from "@/types/recommendation";
import type { CatalogItem, ScoredComponent } from "@/recommendation-engine/models";
import type { TraitMetadata } from "@/recommendation-engine/traits";

import {
  BUILD_DOMAIN_KEYS,
  BUILD_DOMAIN_LABELS,
  type BuildDomainKey,
  buildComponentDisplayText,
  splitBuildComponentText,
} from "./results-build-utils";
import { DISPLAY_K } from "./results-constants";
import { alternativeTagline } from "./results-text-utils";

export type CompareAxisBars = {
  noise: number;
  tactile: number;
  bottomOut: number;
};

export type CompareBuildPart = {
  domain: BuildDomainKey;
  label: string;
  name: string;
  changed: boolean;
};

export type CompareBuildRow = {
  id: string;
  name: string;
  matchPercent: number | null;
  isCurrent: boolean;
  bars: CompareAxisBars;
  parts: CompareBuildPart[];
  diffSummary: string | null;
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

function normalizeDomain(domain: string): BuildDomainKey | null {
  const d = domain.toLowerCase();
  if (d === "switch" || d === "switches") return "switch";
  if (d === "plate" || d === "plates") return "plate";
  if (d === "foam" || d === "foams") return "foam";
  if (d === "layout" || d === "layouts") return "layout";
  if (d === "case" || d === "cases") return "case";
  if (d === "keycap" || d === "keycaps") return "keycap";
  return null;
}

export function resolveCompareBuildParts(
  build: RecommendedBuild,
  apiPicks: Array<{ domain: string; itemId: string; itemName?: string }> = [],
): CompareBuildPart[] {
  return BUILD_DOMAIN_KEYS.map((domain) => {
    const parsed = splitBuildComponentText(buildComponentDisplayText(build, domain, apiPicks));
    return {
      domain,
      label: BUILD_DOMAIN_LABELS[domain],
      name: parsed.name,
      changed: false,
    };
  });
}

function withSwappedPart(
  baseParts: CompareBuildPart[],
  domain: BuildDomainKey,
  nextName: string,
): CompareBuildPart[] {
  return baseParts.map((part) =>
    part.domain === domain
      ? { ...part, name: nextName.trim() || part.name, changed: true }
      : { ...part, changed: false },
  );
}

function shortPartName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed === "—") return "";
  return trimmed.split(/\s+/).slice(0, 3).join(" ");
}

export function currentCompareBuildName(
  answers: SurveySubmission["answers"],
  parts: CompareBuildPart[],
): string {
  const headline = compareBuildHeadline(answers);
  const caseName = shortPartName(parts.find((part) => part.domain === "case")?.name ?? "");
  if (caseName) return `${caseName} · ${headline}`;
  return `${headline} 조합`;
}

function blendBarsForVariant(
  current: CompareAxisBars,
  variantHint: CompareAxisBars,
  domain: BuildDomainKey,
): CompareAxisBars {
  if (domain === "switch") {
    return {
      noise: variantHint.noise,
      tactile: variantHint.tactile,
      bottomOut: variantHint.bottomOut !== 3 ? variantHint.bottomOut : current.bottomOut,
    };
  }
  if (domain === "foam" || domain === "case" || domain === "plate") {
    return {
      noise: variantHint.noise !== 3 ? variantHint.noise : current.noise,
      tactile: current.tactile,
      bottomOut: variantHint.bottomOut !== 3 ? variantHint.bottomOut : current.bottomOut,
    };
  }
  return current;
}

export function buildCompareDiffSummary(
  domain: BuildDomainKey,
  currentBars: CompareAxisBars,
  nextBars: CompareAxisBars,
): string {
  const label = BUILD_DOMAIN_LABELS[domain];
  const deltas: string[] = [];
  if (nextBars.noise < currentBars.noise) deltas.push("소음이 더 낮아질 수 있어요");
  else if (nextBars.noise > currentBars.noise) deltas.push("소음이 더 커질 수 있어요");
  if (nextBars.tactile > currentBars.tactile) deltas.push("구분감이 더 살아날 수 있어요");
  else if (nextBars.tactile < currentBars.tactile) deltas.push("타건이 더 매끈해질 수 있어요");
  if (nextBars.bottomOut > currentBars.bottomOut) deltas.push("바닥감이 더 단단해질 수 있어요");
  else if (nextBars.bottomOut < currentBars.bottomOut) deltas.push("바닥감이 더 부드러워질 수 있어요");

  if (deltas.length === 0) return `${label}만 바꾼 조합이에요.`;
  return `${label}만 바꾼 조합이에요. ${deltas[0]}`;
}

type DomainAlt = {
  domain: BuildDomainKey;
  alt: ApiAlternative;
  pickScore?: number;
};

function collectDomainAlternatives(apiPicks: ApiPick[], limit: number): DomainAlt[] {
  const rows: DomainAlt[] = [];
  const switchPick = apiPicks.find((pick) => normalizeDomain(pick.domain) === "switch");
  for (const alt of switchPick?.alternatives ?? []) {
    rows.push({ domain: "switch", alt, pickScore: switchPick?.score });
    if (rows.length >= limit) return rows;
  }

  for (const pick of apiPicks) {
    const domain = normalizeDomain(pick.domain);
    if (!domain || domain === "switch") continue;
    for (const alt of pick.alternatives ?? []) {
      rows.push({ domain, alt, pickScore: pick.score });
      if (rows.length >= limit) return rows;
    }
  }
  return rows;
}

/** API results — current full build + up to two part-swap variants. */
export function buildApiCompareRows(
  submission: SurveySubmission,
  build: RecommendedBuild,
  apiPicks: ApiPick[],
): CompareBuildRow[] {
  const currentMatch = resolveMatchPercent(submission);
  const currentBars = surveyAnswersToCompareBars(submission.answers);
  const baseParts = resolveCompareBuildParts(build, apiPicks);

  const rows: CompareBuildRow[] = [
    {
      id: "current",
      name: currentCompareBuildName(submission.answers, baseParts),
      matchPercent: currentMatch,
      isCurrent: true,
      bars: currentBars,
      parts: baseParts,
      diffSummary: null,
    },
  ];

  const variants = collectDomainAlternatives(apiPicks, 2);
  for (const [idx, variant] of variants.entries()) {
    const altName = (variant.alt.itemName ?? "").trim() || alternativeTagline(idx);
    const parts = withSwappedPart(baseParts, variant.domain, altName);
    const text = `${variant.alt.summary} ${variant.alt.description ?? ""} ${altName}`;
    const hintBars = inferCompareBarsFromText(text);
    const bars = blendBarsForVariant(currentBars, hintBars, variant.domain);

    rows.push({
      id: `alt-${variant.domain}-${variant.alt.itemId}`,
      name: `대안 조합 · ${alternativeTagline(idx)}`,
      matchPercent: scaledAlternativeMatch(currentMatch, variant.pickScore, variant.alt.score),
      isCurrent: false,
      bars,
      parts,
      diffSummary: buildCompareDiffSummary(variant.domain, currentBars, bars),
    });
  }

  return rows.slice(0, 3);
}

/** Lite/local engine — headline build + top switch candidates as switch-swap variants. */
export function buildLiteCompareRows(
  submission: SurveySubmission,
  build: RecommendedBuild,
  switches: ScoredComponent<CatalogItem>[],
): CompareBuildRow[] {
  const currentMatch = resolveMatchPercent(submission);
  const currentBars = surveyAnswersToCompareBars(submission.answers);
  const baseParts = resolveCompareBuildParts(build, []);

  const rows: CompareBuildRow[] = [
    {
      id: "current",
      name: currentCompareBuildName(submission.answers, baseParts),
      matchPercent: currentMatch,
      isCurrent: true,
      bars: currentBars,
      parts: baseParts,
      diffSummary: null,
    },
  ];

  const topPickScore = switches[0]?.score;
  for (const [idx, row] of switches.slice(1, DISPLAY_K).entries()) {
    const parts = withSwappedPart(baseParts, "switch", row.item.name);
    const bars = blendBarsForVariant(currentBars, traitMetadataToCompareBars(row.item.traitMetadata), "switch");
    rows.push({
      id: `lite-switch-${row.item.id}`,
      name: `대안 조합 · ${alternativeTagline(idx)}`,
      matchPercent: scaledAlternativeMatch(currentMatch, topPickScore, row.score),
      isCurrent: false,
      bars,
      parts,
      diffSummary: buildCompareDiffSummary("switch", currentBars, bars),
    });
  }

  return rows.slice(0, 3);
}
