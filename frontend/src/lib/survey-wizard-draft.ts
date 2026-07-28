/**
 * Mid-wizard draft (sessionStorage). Separate from completed `kr_survey_v2`.
 *
 * Restore rules (SUR-01 / SUR-02):
 * - Persist while phase is entry|questions.
 * - Incomplete mid-wizard: remount/refresh → hydrate to saved phase + stepIndex.
 * - After successful submit: keep draft with `completedForResults` so browser **back**
 *   from /results restores the last question step (SUR-02).
 * - Fresh navigation to /recommend (nav tab / link) after submit → start at entry
 *   (clear completed draft). Detect back via `popstate` (App Router soft nav) with
 *   Navigation Timing fallback for full document loads.
 * - Clear on explicit reset / 「처음부터」.
 */
import type { SurveyAnswers, SurveyStepId } from "@/types/survey";

const DRAFT_KEY = "kr_survey_wizard_draft_v1";
const NAV_POP_KEY = "kr_survey_nav_pop_v1";

export type SurveyWizardDraft = {
  version: 1;
  phase: "entry" | "questions";
  stepIndex: number;
  answers: Partial<SurveyAnswers>;
  selectedStyle: "creamy_quiet" | "crisp_expressive" | "balanced" | null;
  seededStepIds: SurveyStepId[];
  nlPreferenceText: string;
  updatedAtIso: string;
  /** Set after successful submit; cleared after back-restore or fresh entry. */
  completedForResults?: boolean;
};

export function saveSurveyWizardDraft(
  draft: Omit<SurveyWizardDraft, "version" | "updatedAtIso">,
): void {
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

/**
 * Must run while chrome is mounted (e.g. site header) so popstate is recorded
 * even when SurveyWizard is unmounted on /results.
 */
export function installSurveyNavPopListener(): void {
  if (typeof window === "undefined") return;
  const w = window as Window & { __krSurveyNavPopInstalled?: boolean };
  if (w.__krSurveyNavPopInstalled) return;
  w.__krSurveyNavPopInstalled = true;
  window.addEventListener("popstate", () => {
    try {
      window.sessionStorage.setItem(NAV_POP_KEY, "1");
    } catch {
      // ignore
    }
  });
}

/**
 * True when this mount follows a browser back/forward traversal.
 * Consumes the popstate flag so a later remount does not reuse it.
 */
export function isBrowserBackNavigation(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(NAV_POP_KEY) === "1") {
      window.sessionStorage.removeItem(NAV_POP_KEY);
      return true;
    }
  } catch {
    // ignore
  }
  try {
    const entries = window.performance.getEntriesByType("navigation");
    const nav = entries[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type === "back_forward") return true;
    const legacy = (
      window.performance as Performance & { navigation?: { type?: number } }
    ).navigation;
    // PerformanceNavigation.TYPE_BACK_FORWARD === 2
    if (legacy?.type === 2) return true;
  } catch {
    // ignore
  }
  return false;
}
