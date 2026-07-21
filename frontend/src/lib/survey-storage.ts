import type { SurveySubmission } from "@/types/survey";

const STORAGE_KEY = "kr_survey_v2";
const LAST_GOOD_KEY = "kr_last_good_v2";

export function saveSurveySubmission(submission: SurveySubmission): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(submission));
  if (submission.source === "api" || submission.build) {
    localStorage.setItem(LAST_GOOD_KEY, JSON.stringify(submission));
  }
}

export function loadSurveySubmission(): SurveySubmission | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SurveySubmission;
    if (parsed.version !== 2 || !parsed.answers || !parsed.traits) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function loadLastKnownGoodSubmission(): SurveySubmission | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LAST_GOOD_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SurveySubmission;
    if (parsed.version !== 2 || !parsed.answers || !parsed.traits) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** True when this browser has a restorable recommendation result (session or last-known-good). */
export function hasUsableRecentRecommendationResult(): boolean {
  const submission = loadSurveySubmission() ?? loadLastKnownGoodSubmission();
  return Boolean(submission?.build?.id);
}
