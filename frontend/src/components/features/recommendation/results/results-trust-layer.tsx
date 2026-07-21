import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";

import { ResultsBuildHighlights } from "./results-build-highlights";
import { ResultsConfidenceStory } from "./results-confidence-story";
import { deriveConfidenceStory } from "./results-confidence-story-content";
import { formatBuildHighlights } from "./results-build-highlights-content";
import { ResultsTraitMiniProfile } from "./results-trait-mini-profile";

type ApiPick = NonNullable<SurveySubmission["recommendations"]>[number];

export type ResultsTrustLayerProps = {
  submission: SurveySubmission;
  build: RecommendedBuild;
  apiPicks: ApiPick[];
  applyingRefine?: boolean;
  onApplyRefinement?: (stepId: string, answerId: string, label: string) => void;
};

export function ResultsTrustLayer({
  submission,
  build,
  apiPicks,
  applyingRefine,
  onApplyRefinement,
}: ResultsTrustLayerProps) {
  const story = deriveConfidenceStory(submission, apiPicks);
  const hasMiniProfile =
    !!submission.userTraitScores && Object.keys(submission.userTraitScores).length > 0;
  const hasHighlights = formatBuildHighlights(build.highlights).length > 0;

  if (!story && !hasMiniProfile && !hasHighlights) return null;

  return (
    <section data-testid="e2e-trust-layer" className="space-y-3">
      {story ? (
        <ResultsConfidenceStory
          submission={submission}
          apiPicks={apiPicks}
          applyingRefine={applyingRefine}
          onApplyRefinement={onApplyRefinement}
        />
      ) : null}
      {hasHighlights ? <ResultsBuildHighlights build={build} /> : null}
      {hasMiniProfile ? (
        <details className="group rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container-lowest">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-ca-on-surface [&::-webkit-details-marker]:hidden sm:px-4">
            <span className="flex items-center justify-between gap-2">
              <span>취향 스냅샷</span>
              <span className="text-xs font-normal text-ca-on-surface-variant group-open:hidden">펼치기</span>
              <span className="hidden text-xs font-normal text-ca-on-surface-variant group-open:inline">접기</span>
            </span>
          </summary>
          <div className="border-t border-ca-outline-variant/35 px-1 pb-1 sm:px-2 sm:pb-2">
            <ResultsTraitMiniProfile submission={submission} />
          </div>
        </details>
      ) : null}
    </section>
  );
}
