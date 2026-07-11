/**
 * Bridges NL boosts into the same `EngineTraitVector` shape as `buildUserPreferenceVector`.
 *
 * Design:
 * - **Survey stays primary** — NL is a nudge (`NL_DELTA_SCALE`), not a second survey.
 * - **Scaling** — raw rule sums can be large; we scale before `addEngineVectors` so one sentence
 *   shifts rankings without erasing structured answers.
 */

import { simpleNlPreferenceParser } from "@/nl-preference/simple-parser";
import type { NlPreferenceParser } from "@/nl-preference/types";
import { addEngineVectors, emptyEngineVector, type EngineTraitVector } from "@/recommendation-engine/traits";
import { scaleVector } from "@/recommendation-engine/vector-math";
import { buildUserPreferenceVector } from "@/recommendation-engine/user-vector";
import type { SurveySubmission } from "@/types/survey";

/** How strongly sparse NL deltas move the final vector (tunable). */
export const NL_DELTA_SCALE = 0.32;

let activeParser: NlPreferenceParser = simpleNlPreferenceParser;

/** Swap for an AI-backed parser without changing recommendation components. */
export function setNlPreferenceParser(parser: NlPreferenceParser): void {
  activeParser = parser;
}

export function getNlPreferenceParser(): NlPreferenceParser {
  return activeParser;
}

/**
 * Single entry for the UI layer: survey vector + optional NL text → one vector for `recommendKeyboardStack`.
 */
export function buildPreferenceVectorFromSubmission(submission: SurveySubmission): EngineTraitVector {
  const base = buildUserPreferenceVector(submission.traits, submission.answers);
  const raw = submission.nlPreferenceText?.trim();
  if (!raw) return base;

  const parsed = activeParser.parse(raw);
  const nlCore = addEngineVectors(emptyEngineVector(), parsed.traitDelta, 1);
  const nlScaled = scaleVector(nlCore, NL_DELTA_SCALE);
  return addEngineVectors(base, nlScaled, 1);
}
