/**
 * Runtime validation + normalization for `POST /api/v1/recommendations/compute`.
 * Keeps the UI on a single predictable shape (arrays/maps never undefined).
 */

import { normalizeSwagkeyProductUrl } from "@/lib/swagkey-source-links";
import { ApiError } from "@/lib/api/client";
import type { EngineTraitVector } from "@/recommendation-engine/traits";
import type { RecommendedBuild } from "@/types/recommendation";
import type {
  FeedbackLearningInfo,
  MatchExplanationItem,
  NlPreferenceAnalysis,
  PersonalizationMetricsInfo,
  RecommendationApiResponse,
} from "@/types/recommendation-api";
import type { SurveyAnswers } from "@/types/survey";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function pickList(raw: unknown): MatchExplanationItem[] {
  if (!Array.isArray(raw)) return [];
  const out: MatchExplanationItem[] = [];
  for (const row of raw) {
    if (!isRecord(row)) continue;
    const domain = row.domain;
    const itemId = row.itemId;
    const itemName = typeof row.itemName === "string" ? row.itemName : "";
    const score = row.score;
    const explanation = row.explanation;
    if (typeof domain !== "string" || typeof itemId !== "string" || typeof explanation !== "string") continue;
    if (typeof score !== "number" || !Number.isFinite(score)) continue;
    const summary = typeof row.summary === "string" ? row.summary : "";
    const whyTraits = stringList(row.whyTraits);
    const tradeOffs = stringList(row.tradeOffs);
    const confidence =
      typeof row.confidence === "number" && Number.isFinite(row.confidence) ? clamp01(row.confidence) : 0;
    const rawCosine =
      typeof row.rawCosine === "number" && Number.isFinite(row.rawCosine) ? row.rawCosine : undefined;
    const alternatives = Array.isArray(row.alternatives)
      ? row.alternatives
          .filter((a): a is Record<string, unknown> => isRecord(a))
          .map((a) => ({
            itemId: typeof a.itemId === "string" ? a.itemId : "",
            ...(typeof a.itemName === "string" ? { itemName: a.itemName } : {}),
            score: typeof a.score === "number" && Number.isFinite(a.score) ? a.score : 0,
            summary: typeof a.summary === "string" ? a.summary : "",
            ...(typeof a.description === "string" && a.description.trim() ? { description: a.description.trim() } : {}),
            ...(typeof a.tradeOff === "string" ? { tradeOff: a.tradeOff } : {}),
            ...(typeof a.sourceUrl === "string" && a.sourceUrl ? { sourceUrl: normalizeSwagkeyProductUrl(a.sourceUrl) } : {}),
            ...(typeof a.imageUrl === "string" && a.imageUrl.trim() ? { imageUrl: a.imageUrl.trim() } : {}),
          }))
          .filter((a) => a.itemId.length > 0)
      : [];
    out.push({
      domain,
      itemId,
      ...(itemName ? { itemName } : {}),
      score,
      explanation,
      summary,
      whyTraits,
      tradeOffs,
      confidence,
      ...(typeof row.sourceUrl === "string" && row.sourceUrl ? { sourceUrl: normalizeSwagkeyProductUrl(row.sourceUrl) } : {}),
      ...(typeof row.imageUrl === "string" && row.imageUrl.trim() ? { imageUrl: row.imageUrl.trim() } : {}),
      ...(alternatives.length > 0 ? { alternatives } : {}),
      ...(rawCosine !== undefined ? { rawCosine } : {}),
    });
  }
  return out;
}

function numMap(raw: unknown): Record<string, number> {
  if (!isRecord(raw)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

function stringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

function optionalRecord(raw: unknown): Record<string, unknown> | undefined {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return undefined;
}

function parseNlPreferenceAnalysis(raw: unknown): NlPreferenceAnalysis | undefined {
  if (!isRecord(raw)) return undefined;
  const applied = raw.applied === true;
  const normalizedText = typeof raw.normalizedText === "string" ? raw.normalizedText : "";
  let parsingConfidence = 0;
  if (typeof raw.parsingConfidence === "number" && Number.isFinite(raw.parsingConfidence)) {
    parsingConfidence = clamp01(raw.parsingConfidence);
  }
  return {
    applied,
    normalizedText,
    parsingConfidence,
    matchedTermIds: stringList(raw.matchedTermIds),
    unknownTokens: stringList(raw.unknownTokens),
    warnings: stringList(raw.warnings),
  };
}

function parsePersonalizationMetrics(raw: unknown): PersonalizationMetricsInfo | undefined {
  if (!isRecord(raw)) return undefined;
  const signalMix = isRecord(raw.signalMix) ? numMap(raw.signalMix) : undefined;
  return {
    ...(typeof raw.windowEvents === "number" && Number.isFinite(raw.windowEvents) ? { windowEvents: raw.windowEvents } : {}),
    ...(typeof raw.weightedMass === "number" && Number.isFinite(raw.weightedMass) ? { weightedMass: raw.weightedMass } : {}),
    ...(typeof raw.decayPerStep === "number" && Number.isFinite(raw.decayPerStep) ? { decayPerStep: raw.decayPerStep } : {}),
    ...(typeof raw.traitGateFactor === "number" && Number.isFinite(raw.traitGateFactor) ? { traitGateFactor: raw.traitGateFactor } : {}),
    ...(typeof raw.refinementEvents === "number" && Number.isFinite(raw.refinementEvents) ? { refinementEvents: raw.refinementEvents } : {}),
    ...(typeof raw.gatedTraitNudges === "boolean" ? { gatedTraitNudges: raw.gatedTraitNudges } : {}),
    ...(typeof raw.traitNudgeL1 === "number" && Number.isFinite(raw.traitNudgeL1) ? { traitNudgeL1: raw.traitNudgeL1 } : {}),
    ...(typeof raw.partMultiplierSpread === "number" && Number.isFinite(raw.partMultiplierSpread)
      ? { partMultiplierSpread: raw.partMultiplierSpread }
      : {}),
    ...(signalMix && Object.keys(signalMix).length > 0 ? { signalMix } : {}),
  };
}

function parseFeedbackLearningInfo(raw: unknown): FeedbackLearningInfo | undefined {
  if (!isRecord(raw)) return undefined;
  const personalizationMetrics = parsePersonalizationMetrics(raw.personalizationMetrics);
  return {
    applied: raw.applied === true,
    ...(typeof raw.scenarioId === "string" ? { scenarioId: raw.scenarioId } : {}),
    ...(typeof raw.reason === "string" ? { reason: raw.reason } : {}),
    ...(Array.isArray(raw.lines) ? { lines: stringList(raw.lines) } : {}),
    ...(isRecord(raw.sampleMultipliers) ? { sampleMultipliers: numMap(raw.sampleMultipliers) } : {}),
    ...(personalizationMetrics && Object.keys(personalizationMetrics).length > 0 ? { personalizationMetrics } : {}),
  };
}

function parseConfidenceGuidance(
  raw: unknown,
): { isLowConfidence: boolean; shortReason: string; followUpQuestions: string[]; actions?: { label: string; stepId: string; answerId: string }[] } | undefined {
  if (!isRecord(raw)) return undefined;
  const actions = Array.isArray(raw.actions)
    ? raw.actions
        .filter((x): x is Record<string, unknown> => isRecord(x))
        .map((x) => ({
          label: typeof x.label === "string" ? x.label : "",
          stepId: typeof x.stepId === "string" ? x.stepId : "",
          answerId: typeof x.answerId === "string" ? x.answerId : "",
        }))
        .filter((x) => x.label && x.stepId && x.answerId)
    : [];
  return {
    isLowConfidence: raw.isLowConfidence === true,
    shortReason: typeof raw.shortReason === "string" ? raw.shortReason : "",
    followUpQuestions: stringList(raw.followUpQuestions),
    ...(actions.length > 0 ? { actions } : {}),
  };
}

const SURVEY_KEYS: (keyof SurveyAnswers)[] = [
  "sound_profile",
  "typing_pressure",
  "switch_feel",
  "bottom_out",
  "volume",
];

function parseAnswers(raw: unknown): SurveyAnswers {
  if (!isRecord(raw)) {
    throw new ApiError(0, "Invalid API response: answers must be an object.");
  }
  for (const key of SURVEY_KEYS) {
    const v = raw[key];
    if (typeof v !== "string") {
      throw new ApiError(0, `Invalid API response: answers.${key} must be a string.`);
    }
  }
  return raw as unknown as SurveyAnswers;
}

function parseBuild(raw: unknown): RecommendedBuild {
  if (!isRecord(raw)) {
    throw new ApiError(0, "Invalid API response: build must be an object.");
  }
  const id = raw.id;
  const title = raw.title;
  const tagline = raw.tagline;
  const switches = raw.switches;
  const plate = raw.plate;
  const foam = raw.foam;
  const layout = raw.layout;
  const casePart = raw.case;
  const keycapPart = raw.keycap;
  for (const [label, v] of [
    ["id", id],
    ["title", title],
    ["tagline", tagline],
    ["switches", switches],
    ["plate", plate],
    ["foam", foam],
    ["layout", layout],
  ] as const) {
    if (typeof v !== "string") {
      throw new ApiError(0, `Invalid API response: build.${label} must be a string.`);
    }
  }
  const highlights = stringList(raw.highlights);
  let engineScores: RecommendedBuild["engineScores"];
  const es = raw.engineScores;
  if (isRecord(es)) {
    const nums = (k: string) => {
      const x = es[k];
      return typeof x === "number" && Number.isFinite(x) ? x : undefined;
    };
    const str = (k: string) => (typeof es[k] === "string" ? (es[k] as string) : undefined);
    const switchId = str("switchId");
    const plateId = str("plateId");
    const foamId = str("foamId");
    const layoutId = str("layoutId");
    const caseId = str("caseId");
    const keycapId = str("keycapId");
    const switchScore = nums("switchScore");
    const plateScore = nums("plateScore");
    const foamScore = nums("foamScore");
    const layoutScore = nums("layoutScore");
    const caseScore = nums("caseScore");
    const keycapScore = nums("keycapScore");
    if (
      switchId &&
      plateId &&
      foamId &&
      layoutId &&
      caseId &&
      switchScore !== undefined &&
      plateScore !== undefined &&
      foamScore !== undefined &&
      layoutScore !== undefined &&
      caseScore !== undefined
    ) {
      engineScores = {
        switchId,
        plateId,
        foamId,
        layoutId,
        caseId,
        switchScore,
        plateScore,
        foamScore,
        layoutScore,
        caseScore,
        ...(keycapId ? { keycapId } : {}),
        ...(keycapScore !== undefined ? { keycapScore } : {}),
      };
    }
  }
  let sourceUrls: RecommendedBuild["sourceUrls"];
  const su = raw.sourceUrls;
  if (isRecord(su)) {
    const pickUrl = (k: string) => (typeof su[k] === "string" ? (su[k] as string) : "");
    const mapped = {
      switch: normalizeSwagkeyProductUrl(pickUrl("switch")),
      plate: normalizeSwagkeyProductUrl(pickUrl("plate")),
      foam: normalizeSwagkeyProductUrl(pickUrl("foam")),
      layout: normalizeSwagkeyProductUrl(pickUrl("layout")),
      case: normalizeSwagkeyProductUrl(pickUrl("case")),
      keycap: normalizeSwagkeyProductUrl(pickUrl("keycap")),
    };
    if (Object.values(mapped).some((v) => v.length > 0)) {
      sourceUrls = mapped;
    }
  }
  return {
    id: id as string,
    title: title as string,
    tagline: tagline as string,
    switches: switches as string,
    plate: plate as string,
    foam: foam as string,
    layout: layout as string,
    ...(typeof casePart === "string" ? { case: casePart } : {}),
    ...(typeof keycapPart === "string" ? { keycap: keycapPart } : {}),
    highlights,
    ...(engineScores !== undefined ? { engineScores } : {}),
    ...(sourceUrls !== undefined ? { sourceUrls } : {}),
  };
}

/**
 * Validates the compute response and normalizes optional JSON to stable defaults.
 */
export function parseRecommendationApiResponse(raw: unknown): RecommendationApiResponse {
  if (!isRecord(raw)) {
    throw new ApiError(0, "Invalid API response: body must be a JSON object.");
  }

  const answers = parseAnswers(raw.answers);
  const legacyTraits = numMap(raw.legacyTraits);
  const userVector = numMap(raw.userVector);
  if (Object.keys(userVector).length === 0) {
    throw new ApiError(0, "Invalid API response: userVector must be a non-empty number map.");
  }

  const userTraitScores = numMap(raw.userTraitScores);
  const traitAxes = stringList(raw.traitAxes);
  const fromRec = pickList(raw.recommendations);
  const fromMatch = pickList(raw.matchExplanations);
  const picks = fromRec.length > 0 ? fromRec : fromMatch;

  const completedAtIso = raw.completedAtIso;
  if (typeof completedAtIso !== "string" || !completedAtIso.trim()) {
    throw new ApiError(0, "Invalid API response: completedAtIso must be a non-empty string.");
  }

  const build = parseBuild(raw.build);
  // ``quick`` is contract rev 7 degraded fallback — not the removed user-facing quick recommendation.
  const runMode = raw.runMode === "quick" ? "quick" : raw.runMode === "full" ? "full" : undefined;
  const degradedReason = typeof raw.degradedReason === "string" ? raw.degradedReason : undefined;

  let overallConfidence = 0;
  if (typeof raw.overallConfidence === "number" && Number.isFinite(raw.overallConfidence)) {
    overallConfidence = clamp01(raw.overallConfidence);
  }

  const nlPreferenceAnalysis = parseNlPreferenceAnalysis(raw.nlPreferenceAnalysis);

  const compatibilityAudit = optionalRecord(raw.compatibilityAudit);
  const diversityAudit = optionalRecord(raw.diversityAudit);
  const fallbackAudit = optionalRecord(raw.fallbackAudit);
  const recommendationConfidence = optionalRecord(raw.recommendationConfidence);
  const feedbackLearning = parseFeedbackLearningInfo(raw.feedbackLearning);
  const confidenceGuidance = parseConfidenceGuidance(raw.confidenceGuidance);

  return {
    answers,
    ...(runMode ? { runMode } : {}),
    ...(degradedReason ? { degradedReason } : {}),
    legacyTraits,
    userVector: userVector as EngineTraitVector,
    userTraitScores,
    traitAxes,
    recommendations: picks,
    matchExplanations: picks,
    overallConfidence,
    build,
    completedAtIso: completedAtIso.trim(),
    ...(nlPreferenceAnalysis !== undefined ? { nlPreferenceAnalysis } : {}),
    ...(compatibilityAudit !== undefined ? { compatibilityAudit } : {}),
    ...(diversityAudit !== undefined ? { diversityAudit } : {}),
    ...(fallbackAudit !== undefined ? { fallbackAudit } : {}),
    ...(recommendationConfidence !== undefined ? { recommendationConfidence } : {}),
    ...(feedbackLearning !== undefined ? { feedbackLearning } : {}),
    ...(confidenceGuidance !== undefined ? { confidenceGuidance } : {}),
  };
}
