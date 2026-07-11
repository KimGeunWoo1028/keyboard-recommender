/**
 * Bridges survey-derived `TraitAccumulator` + raw answers into the engine's
 * canonical `EngineTraitVector` with optional per-answer weighting.
 *
 * This is the extension point when you add new survey steps: map them to
 * `TraitMetadata` deltas and merge here.
 */

import type { SurveyAnswers } from "@/types/survey";
import type { TraitAccumulator } from "@/types/traits";
import {
  addEngineVectors,
  emptyEngineVector,
  type EngineTraitVector,
  type TraitMetadata,
} from "@/recommendation-engine/traits";
import { scaleVector } from "@/recommendation-engine/vector-math";

/** Global multiplier applied after mapping (tune sensitivity). */
export const USER_VECTOR_GAIN = 1.15;

/** How strongly explicit answer ids nudge the vector (on top of trait scores). */
const ANSWER_WEIGHT = 0.85;

/** Map legacy survey trait buckets into canonical engine axes. */
export function traitAccumulatorToEngineVector(traits: TraitAccumulator): EngineTraitVector {
  let v = emptyEngineVector();

  v = addEngineVectors(v, {
    deep_sound: traits.soundThocky * 0.9 + traits.soundMuted * 0.15,
    clacky: traits.soundClacky * 0.95 + traits.soundBright * 0.55,
    soft: traits.softBottom * 0.9 + traits.soundMuted * 0.35 + traits.volumeQuiet * 0.25,
    firm: traits.firmBottom * 0.95 + traits.heavyPress * 0.2,
    smooth: traits.linearLean * 0.9 + traits.lightPress * 0.15,
    tactile_strength: traits.tactileLean * 0.95,
  });

  /* Quiet users: pull down clacky a bit without a separate "quiet" axis */
  if (traits.volumeQuiet > traits.volumeLoud) {
    v.clacky = Math.max(0, v.clacky - (traits.volumeQuiet - traits.volumeLoud) * 0.25);
  }
  if (traits.volumeLoud > traits.volumeQuiet) {
    v.clacky += (traits.volumeLoud - traits.volumeQuiet) * 0.2;
  }

  return v;
}

function answerBonuses(answers: SurveyAnswers): TraitMetadata {
  const b: TraitMetadata = {};

  switch (answers.sound_profile) {
    case "thocky":
      b.deep_sound = 3;
      b.soft = 1;
      break;
    case "clacky":
      b.clacky = 3.5;
      b.firm = 1;
      break;
    case "muted":
      b.soft = 2.5;
      b.deep_sound = 0.5;
      b.clacky = -1;
      break;
    case "bright":
      b.clacky = 2;
      break;
    case "balanced":
      b.deep_sound = 1;
      b.smooth = 1;
      break;
    default:
      break;
  }

  switch (answers.typing_pressure) {
    case "light":
      b.smooth = (b.smooth ?? 0) + 2;
      b.soft = (b.soft ?? 0) + 1;
      break;
    case "heavy":
      b.firm = (b.firm ?? 0) + 2.5;
      break;
    case "medium":
      b.firm = (b.firm ?? 0) + 0.5;
      b.soft = (b.soft ?? 0) + 0.5;
      break;
    default:
      break;
  }

  switch (answers.switch_feel) {
    case "linear":
      b.smooth = (b.smooth ?? 0) + 3;
      b.tactile_strength = -1;
      break;
    case "tactile_light":
      b.tactile_strength = (b.tactile_strength ?? 0) + 1.5;
      b.smooth = (b.smooth ?? 0) + 0.5;
      break;
    case "tactile_clear":
      b.tactile_strength = (b.tactile_strength ?? 0) + 3.5;
      b.firm = (b.firm ?? 0) + 0.5;
      break;
    default:
      break;
  }

  switch (answers.bottom_out) {
    case "soft":
      b.soft = (b.soft ?? 0) + 3;
      break;
    case "firm":
      b.firm = (b.firm ?? 0) + 3;
      break;
    case "medium":
      b.soft = (b.soft ?? 0) + 1;
      b.firm = (b.firm ?? 0) + 1;
      break;
    default:
      break;
  }

  switch (answers.volume) {
    case "quiet":
      b.soft = (b.soft ?? 0) + 2;
      b.clacky = (b.clacky ?? 0) - 1;
      break;
    case "loud":
      b.clacky = (b.clacky ?? 0) + 2;
      break;
    case "moderate":
      b.deep_sound = (b.deep_sound ?? 0) + 0.5;
      break;
    default:
      break;
  }

  return b;
}

/** Full pipeline: accumulated traits + weighted answer bonuses → preference vector */
export function buildUserPreferenceVector(traits: TraitAccumulator, answers: SurveyAnswers): EngineTraitVector {
  const base = traitAccumulatorToEngineVector(traits);
  const bonus = answerBonuses(answers);
  const merged = addEngineVectors(base, bonus, ANSWER_WEIGHT);
  return scaleVector(merged, USER_VECTOR_GAIN);
}
