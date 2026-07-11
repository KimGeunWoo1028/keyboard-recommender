import { SURVEY_STEPS } from "@/lib/survey-definition";
import type { SurveyAnswers, SurveyStepId } from "@/types/survey";

/** Index of the first survey step without an answer; last step if all answered. */
export function firstUnansweredStepIndex(answers: Partial<SurveyAnswers>): number {
  const idx = SURVEY_STEPS.findIndex((step) => answers[step.id] === undefined);
  return idx === -1 ? SURVEY_STEPS.length - 1 : idx;
}

export function selectedOptionLabel(
  stepId: SurveyStepId,
  answerId: SurveyAnswers[SurveyStepId] | undefined,
): string | null {
  if (answerId === undefined) return null;
  const step = SURVEY_STEPS.find((s) => s.id === stepId);
  const opt = step?.options.find((o) => o.id === answerId);
  return opt?.label ?? null;
}
