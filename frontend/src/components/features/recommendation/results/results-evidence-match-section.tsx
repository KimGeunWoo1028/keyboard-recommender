"use client";

import type { SurveySubmission } from "@/types/survey";

import {
  buildEvidenceMatchCallout,
  evidenceMatchRowsFromSubmission,
} from "./results-evidence-match-content";
import { ResultsEvidenceConfidenceCallout } from "./results-evidence-confidence-callout";
import { ResultsEvidenceMatchingTable } from "./results-evidence-matching-table";

type ApiPick = NonNullable<SurveySubmission["recommendations"]>[number];

export type ResultsEvidenceMatchSectionProps = {
  submission: SurveySubmission;
  apiPicks?: ApiPick[];
};

/** Manus-style preference matching table + confidence callout (Phase C). */
export function ResultsEvidenceMatchSection({
  submission,
  apiPicks = [],
}: ResultsEvidenceMatchSectionProps) {
  const rows = evidenceMatchRowsFromSubmission(submission.answers);
  const callout = buildEvidenceMatchCallout(submission, apiPicks);

  return (
    <div className="space-y-6" data-testid="e2e-evidence-match-section">
      <p className="text-sm text-ca-on-surface-variant">
        설문 응답을 기반으로 이 조합을 선정한 근거입니다.
      </p>
      <ResultsEvidenceMatchingTable rows={rows} />
      <ResultsEvidenceConfidenceCallout callout={callout} />
    </div>
  );
}
