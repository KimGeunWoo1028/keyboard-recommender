/**
 * Normalized JSON from `POST /api/v1/recommendations/compute` after `parseRecommendationApiResponse`.
 * Lists and maps are always present (empty containers when the server sent nothing).
 */

import type { EngineTraitVector } from "@/recommendation-engine/traits";
import type { RecommendedBuild } from "@/types/recommendation";
import type { MatchExplanationItem, SurveyAnswers } from "@/types/survey";

export type { MatchExplanationItem };
/** Same shape as `MatchExplanationItem`; canonical name for ranked rows. */
export type RecommendationPick = MatchExplanationItem;

/** Server-side lightweight parse of `naturalLanguage` on `POST .../recommendations/compute`. */
export interface NlPreferenceAnalysis {
  applied: boolean;
  normalizedText: string;
  parsingConfidence: number;
  matchedTermIds: string[];
  unknownTokens: string[];
  warnings: string[];
}

export interface PersonalizationMetricsInfo {
  windowEvents?: number;
  weightedMass?: number;
  decayPerStep?: number;
  traitGateFactor?: number;
  refinementEvents?: number;
  gatedTraitNudges?: boolean;
  traitNudgeL1?: number;
  partMultiplierSpread?: number;
  signalMix?: Record<string, number>;
}

export interface FeedbackLearningInfo {
  applied: boolean;
  scenarioId?: string | null;
  reason?: string;
  lines?: string[];
  sampleMultipliers?: Record<string, number>;
  personalizationMetrics?: PersonalizationMetricsInfo;
}

export interface RecommendationApiResponse {
  answers: SurveyAnswers;
  /** `full` = standard path; `quick` = internal resilient degraded fallback only (not user quick-start). */
  runMode?: "full" | "quick";
  degradedReason?: string;
  legacyTraits: Record<string, number>;
  /** Legacy 6-axis projection for older UI paths. */
  userVector: EngineTraitVector;
  /** v2 multi-axis user profile (same keys as `traitAxes`). */
  userTraitScores: Record<string, number>;
  traitAxes: string[];
  /** Ranked top picks (canonical); same length and order as `matchExplanations`. */
  recommendations: MatchExplanationItem[];
  /** Same as `recommendations` (API keeps both for older clients). */
  matchExplanations: MatchExplanationItem[];
  /** Mean of per-pick `confidence` (0–1). */
  overallConfidence: number;
  build: RecommendedBuild;
  completedAtIso: string;
  /** Present when the API returned `nlPreferenceAnalysis` (v2 contract). */
  nlPreferenceAnalysis?: NlPreferenceAnalysis;
  /** Optional quality-layer payloads (camelCase API keys). */
  compatibilityAudit?: Record<string, unknown>;
  diversityAudit?: Record<string, unknown>;
  fallbackAudit?: Record<string, unknown>;
  recommendationConfidence?: Record<string, unknown>;
  feedbackLearning?: FeedbackLearningInfo;
  confidenceGuidance?: {
    isLowConfidence: boolean;
    shortReason: string;
    followUpQuestions: string[];
    actions?: { label: string; stepId: string; answerId: string }[];
  };
}
