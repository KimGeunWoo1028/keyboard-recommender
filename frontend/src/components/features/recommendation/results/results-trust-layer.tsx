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
    <section data-testid="e2e-trust-layer" className="space-y-2">
      {story ? (
        <ResultsConfidenceStory
          submission={submission}
          apiPicks={apiPicks}
          applyingRefine={applyingRefine}
          onApplyRefinement={onApplyRefinement}
        />
      ) : null}
      {hasMiniProfile ? <ResultsTraitMiniProfile submission={submission} /> : null}
      {hasHighlights ? <ResultsBuildHighlights build={build} /> : null}
    </section>
  );
}
