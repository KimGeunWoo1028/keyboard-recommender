/**
 * UI-facing recommendation: uses the score-based engine (`recommendation-engine/`).
 */

import { buildPreferenceVectorFromSubmission } from "@/nl-preference/merge-submission";
import { recommendKeyboardStack } from "@/recommendation-engine/recommend";
import { buildUserPreferenceVector } from "@/recommendation-engine/user-vector";
import type { EngineTraitVector } from "@/recommendation-engine/traits";
import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveyAnswers, SurveySubmission } from "@/types/survey";
import type { TraitAccumulator } from "@/types/traits";

export function buildRecommendedBuildFromUserVector(userVector: EngineTraitVector): RecommendedBuild {
  const engine = recommendKeyboardStack(userVector);

  const { topSwitch, topPlate, topFoam, topLayout } = engine;

  const titleParts: string[] = [];
  if (userVector.deep_sound >= userVector.clacky) titleParts.push("Warm / deep-leaning");
  else titleParts.push("Crisp / articulate");
  if (userVector.tactile_strength > userVector.smooth) titleParts.push("tactile");
  else titleParts.push("linear-leaning");

  const title = `Your stack: ${titleParts.join(" · ")}`;

  const tagline = `Matched via trait vector scoring — switch, plate, foam, and layout picks align with your survey-derived preference profile.`;

  const highlights = [
    `Engine match — switch score ${topSwitch.score.toFixed(2)} (${topSwitch.item.name})`,
    `Plate score ${topPlate.score.toFixed(2)} · Foam score ${topFoam.score.toFixed(2)} · Layout score ${topLayout.score.toFixed(2)}`,
    `Preference vector peaks: deep ${userVector.deep_sound.toFixed(1)}, clacky ${userVector.clacky.toFixed(1)}, soft ${userVector.soft.toFixed(1)}, firm ${userVector.firm.toFixed(1)}, smooth ${userVector.smooth.toFixed(1)}, tactile ${userVector.tactile_strength.toFixed(1)}`,
  ];

  return {
    id: `engine-${topSwitch.item.id}-${topPlate.item.id}`,
    title,
    tagline,
    switches: `${topSwitch.item.name} — ${topSwitch.item.description}`,
    plate: `${topPlate.item.name} — ${topPlate.item.description}`,
    foam: `${topFoam.item.name} — ${topFoam.item.description}`,
    layout: `${topLayout.item.name} — ${topLayout.item.description}`,
    case: "—",
    keycap: "—",
    highlights,
    engineScores: {
      switchId: topSwitch.item.id,
      plateId: topPlate.item.id,
      foamId: topFoam.item.id,
      layoutId: topLayout.item.id,
      caseId: "—",
      keycapId: "—",
      switchScore: topSwitch.score,
      plateScore: topPlate.score,
      foamScore: topFoam.score,
      layoutScore: topLayout.score,
      caseScore: 0,
      keycapScore: 0,
    },
  };
}

export function getMockBuildFromTraits(traits: TraitAccumulator, answers: SurveyAnswers): RecommendedBuild {
  return buildRecommendedBuildFromUserVector(buildUserPreferenceVector(traits, answers));
}

/** Prefer when NL (or any submission-only signal) should refresh the hero build. */
export function getRecommendedBuildForSubmission(submission: SurveySubmission): RecommendedBuild {
  return buildRecommendedBuildFromUserVector(buildPreferenceVectorFromSubmission(submission));
}
