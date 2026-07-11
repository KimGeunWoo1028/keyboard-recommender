import { SURVEY_STEPS } from "@/lib/survey-definition";
import type { SurveyAnswers, SurveyStepId } from "@/types/survey";
import type { TraitAccumulator } from "@/types/traits";
import { mergeTraitDeltas } from "@/types/traits";

function optionDelta<S extends SurveyStepId>(stepId: S, answerId: SurveyAnswers[S]): Partial<TraitAccumulator> {
  const step = SURVEY_STEPS.find((s) => s.id === stepId);
  if (!step) return {};
  const opt = step.options.find((o) => o.id === answerId);
  return opt?.traitDelta ?? {};
}

/** Map every answered step to trait deltas and merge (mock recommendation input). */
export function computeTraitsFromAnswers(answers: SurveyAnswers): TraitAccumulator {
  const deltas = (Object.keys(answers) as SurveyStepId[]).map((stepId) =>
    optionDelta(stepId, answers[stepId]),
  );
  return mergeTraitDeltas(deltas);
}

export function isCompleteSurveyAnswers(value: Partial<SurveyAnswers>): value is SurveyAnswers {
  return SURVEY_STEPS.every((s) => value[s.id] !== undefined);
}
