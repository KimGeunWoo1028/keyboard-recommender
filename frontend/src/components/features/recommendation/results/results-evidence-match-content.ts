import type { SurveySubmission } from "@/types/survey";

import { deriveConfidenceStory } from "./results-confidence-story-content";
import { preferenceRowsFromAnswers, preferenceTagsFromAnswers } from "./shared-result-header";

export type EvidenceMatchRow = {
  label: string;
  value: string;
  match: boolean;
};

const EVIDENCE_MATCH_LABELS: Record<string, string> = {
  소리: "소리 취향",
  "타건 압력": "입력 강도",
  타건감: "타건감",
  바닥감: "바닥감",
  소음: "소음 민감도",
};

type ApiPick = NonNullable<SurveySubmission["recommendations"]>[number];

/** Survey preference rows for Manus-style evidence matching table. */
export function evidenceMatchRowsFromSubmission(answers: SurveySubmission["answers"]): EvidenceMatchRow[] {
  return preferenceRowsFromAnswers(answers).map((row) => ({
    label: EVIDENCE_MATCH_LABELS[row.label] ?? row.label,
    value: row.value,
    match: true,
  }));
}

export type EvidenceMatchCalloutModel = {
  percent: number | null;
  title: string;
  body: string;
};

function resolveMatchPercent(submission: SurveySubmission): number | null {
  if (typeof submission.overallConfidence === "number" && Number.isFinite(submission.overallConfidence)) {
    return Math.round(submission.overallConfidence * 100);
  }
  const overall = submission.recommendationConfidence?.overall;
  if (typeof overall === "number" && Number.isFinite(overall)) {
    return Math.round(overall * 100);
  }
  return null;
}

/** Confidence callout copy — real survey axes only (no invented budget/layout). */
export function buildEvidenceMatchCallout(
  submission: SurveySubmission,
  apiPicks: ApiPick[] = [],
): EvidenceMatchCalloutModel {
  const rows = evidenceMatchRowsFromSubmission(submission.answers);
  const percent = resolveMatchPercent(submission);
  const story = deriveConfidenceStory(submission, apiPicks);
  const highlights = preferenceTagsFromAnswers(submission.answers).slice(0, 2);

  const reflected = `설문 응답 ${rows.length}개 항목이 이 조합 선정에 반영됐습니다.`;
  const highlight =
    highlights.length >= 2
      ? `${highlights[0]}과 ${highlights[1]} 선호가 특히 강하게 반영되었습니다.`
      : highlights.length === 1
        ? `${highlights[0]} 선호가 특히 강하게 반영되었습니다.`
        : "";

  const support = story?.support?.trim() ?? "";
  const bodyParts = [reflected, support, highlight].filter((part) => part.length > 0);

  return {
    percent,
    title: percent !== null ? `추천 신뢰도 ${percent}%` : "추천 신뢰도",
    body: bodyParts.join(" "),
  };
}
