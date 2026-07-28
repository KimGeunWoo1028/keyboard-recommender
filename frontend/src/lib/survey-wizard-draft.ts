/**
 * Mid-wizard draft (sessionStorage). Separate from completed `kr_survey_v2`.
 *
 * Restore rules (SUR-01 / SUR-02):
 * - Persist while phase is entry|questions (incl. after successful submit).
 * - Remount/refresh/back → hydrate to saved phase + stepIndex (not survey start).
 * - Clear only on explicit reset / 「처음부터」 (not on submit — needed for back from /results).
 */
import type { SurveyAnswers, SurveyStepId } from "@/types/survey";

const DRAFT_KEY = "kr_survey_wizard_draft_v1";

export type SurveyWizardDraft = {
  version: 1;
  phase: "entry" | "questions";
  stepIndex: number;
  answers: Partial<SurveyAnswers>;
  selectedStyle: "creamy_quiet" | "crisp_expressive" | "balanced" | null;
  seededStepIds: SurveyStepId[];
  nlPreferenceText: string;
  updatedAtIso: string;
};

export function saveSurveyWizardDraft(draft: Omit<SurveyWizardDraft, "version" | "updatedAtIso">): void {
  if (typeof window === "undefined") return;
  const payload: SurveyWizardDraft = {
    version: 1,
    ...draft,
    updatedAtIso: new Date().toISOString(),
  };
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota / private mode failures — draft is best-effort.
  }
}

export function loadSurveyWizardDraft(): SurveyWizardDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SurveyWizardDraft;
    if (parsed.version !== 1) return null;
    if (parsed.phase !== "entry" && parsed.phase !== "questions") return null;
    if (typeof parsed.stepIndex !== "number" || parsed.stepIndex < 0) return null;
    if (!parsed.answers || typeof parsed.answers !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSurveyWizardDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
