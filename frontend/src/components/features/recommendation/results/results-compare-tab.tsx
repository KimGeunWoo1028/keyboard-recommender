"use client";

import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";
import type { CatalogItem, ScoredComponent } from "@/recommendation-engine/models";

import { buildApiCompareRows, buildLiteCompareRows } from "./results-compare-content";
import { ResultsCompareBuildCard } from "./results-compare-build-card";

type ApiPick = {
  domain: string;
  itemId: string;
  itemName?: string;
  score?: number;
  summary?: string;
  alternatives?: Array<{
    itemId: string;
    itemName?: string;
    score: number;
    description?: string;
    summary: string;
  }>;
};

export type ResultsCompareTabProps = {
  submission: SurveySubmission;
  build: RecommendedBuild;
  apiPicks?: ApiPick[];
  liteSwitches?: ScoredComponent<CatalogItem>[];
};

export function ResultsCompareTab({
  submission,
  build,
  apiPicks = [],
  liteSwitches = [],
}: ResultsCompareTabProps) {
  const rows =
    apiPicks.length > 0
      ? buildApiCompareRows(submission, build, apiPicks)
      : buildLiteCompareRows(submission, liteSwitches);

  return (
    <div className="space-y-6" data-testid="e2e-results-compare-tab">
      <p className="text-sm text-ca-on-surface-variant">
        다른 조합과 비교해 현재 추천의 위치를 확인하세요.
      </p>
      <div className="space-y-3">
        {rows.map((row) => (
          <ResultsCompareBuildCard key={row.id} row={row} />
        ))}
      </div>
      {rows.length <= 1 ? (
        <p className="text-sm text-ca-on-surface-variant">
          비슷한 대안 후보가 아직 충분하지 않아 현재 추천만 표시됩니다. 근거 탭에서 부품별 설명을 확인해 보세요.
        </p>
      ) : null}
    </div>
  );
}
