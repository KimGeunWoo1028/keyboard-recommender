/**
 * Type-safe survey answers: each key is a step; values are the allowed option ids.
 * Trait deltas in `survey-definition.ts` must use these ids only.
 */

import type { RecommendedBuild } from "@/types/recommendation";
import type { FeedbackLearningInfo, NlPreferenceAnalysis } from "@/types/recommendation-api";
import type { TraitAccumulator } from "@/types/traits";

export type SoundProfileAnswerId = "thocky" | "clacky" | "muted" | "balanced" | "bright";

export type TypingPressureAnswerId = "light" | "medium" | "heavy";

/** Tactile vs linear preference */
export type SwitchFeelAnswerId = "tactile_clear" | "tactile_light" | "linear";

export type BottomOutAnswerId = "soft" | "medium" | "firm";

export type VolumeAnswerId = "quiet" | "moderate" | "loud";

export interface SurveyAnswers {
  sound_profile: SoundProfileAnswerId;
  typing_pressure: TypingPressureAnswerId;
  switch_feel: SwitchFeelAnswerId;
  bottom_out: BottomOutAnswerId;
  volume: VolumeAnswerId;
}

export type SurveyStepId = keyof SurveyAnswers;

export type SurveySubmissionSource = "api" | "local";

/** Top-pick explanation row from the Python v2 trait engine (API). */
export interface MatchExplanationItem {
  domain: string;
  itemId: string;
  itemName?: string;
  score: number;
  /** Weighted-axis driver line (technical). */
  explanation: string;
  /** Short human-readable lead sentence. */
  summary?: string;
  /** Trait-aligned bullets tied to user scores. */
  whyTraits?: string[];
  /** Concise trade-off notes. */
  tradeOffs?: string[];
  /** 0–1 from weighted cosine (before popularity), mapped for display. */
  confidence?: number;
  /** Raw weighted cosine in approximately [-1, 1]. */
  rawCosine?: number;
  /** Nearby alternatives from the same domain (max 1-2). */
  alternatives?: {
    itemId: string;
    itemName?: string;
    score: number;
    description?: string;
    summary: string;
    tradeOff?: string;
    sourceUrl?: string;
    imageUrl?: string;
  }[];
  /** Swagkey product detail URL when available. */
  sourceUrl?: string;
  /** Product thumbnail (local mirror or CDN); layout archetypes are usually empty. */
  imageUrl?: string;
}

/** Payload persisted for the results page (sessionStorage). */
export interface SurveySubmission {
  version: 2;
  answers: SurveyAnswers;
  traits: TraitAccumulator;
  completedAtIso: string;
  /** Present when results came from `POST /api/v1/recommendations/compute`. */
  build?: RecommendedBuild;
  source?: SurveySubmissionSource;
  /** Optional free-text preferences; merged into the engine vector on the results page (client-side). */
  nlPreferenceText?: string;
  /** When `source === "api"`, optional parse summary from `POST .../recommendations/compute`. */
  nlPreferenceAnalysis?: NlPreferenceAnalysis;
  /** True when the API was configured but the browser could not reach it — saved offline instead. */
  apiUnreachableFallback?: boolean;
  /** Legacy 6-axis projection returned by the API (`userVector`). */
  apiUserVector?: Record<string, number>;
  /** v2 multi-axis user profile from the API (`userTraitScores`). */
  userTraitScores?: Record<string, number>;
  traitAxes?: string[];
  /** Canonical ranked picks from API (same as `matchExplanations` when both saved). */
  recommendations?: MatchExplanationItem[];
  matchExplanations?: MatchExplanationItem[];
  /** Mean pick confidence when `source === "api"` (0–1). */
  overallConfidence?: number;
  /** From API when present (camelCase keys). */
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
  degradedReason?: string;
}
