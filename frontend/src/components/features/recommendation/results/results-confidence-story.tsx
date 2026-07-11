"use client";

import type { SurveySubmission } from "@/types/survey";

import { deriveConfidenceStory } from "./results-confidence-story-content";

type ApiPick = NonNullable<SurveySubmission["recommendations"]>[number];

export type ResultsConfidenceStoryProps = {
  submission: SurveySubmission;
  apiPicks: ApiPick[];
  applyingRefine?: boolean;
  onApplyRefinement?: (stepId: string, answerId: string, label: string) => void;
};

export function ResultsConfidenceStory({
  submission,
  apiPicks,
  applyingRefine = false,
  onApplyRefinement,
}: ResultsConfidenceStoryProps) {
  const story = deriveConfidenceStory(submission, apiPicks);
  if (!story) return null;

  return (
    <div
      data-testid="e2e-confidence-story"
      className="rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container/35 px-3 py-3 sm:px-4"
    >
      <p className="font-headline text-sm font-semibold text-ca-on-surface sm:text-base">{story.headline}</p>
      <ul className="mt-2 space-y-1.5">
        {story.bullets.map((bullet) => (
          <li key={bullet.text} className="flex gap-2 text-sm leading-relaxed text-ca-on-surface-variant">
            <span className="shrink-0 text-ca-on-surface" aria-hidden>
              {bullet.kind === "check" ? "✓" : "·"}
            </span>
            <span>{bullet.text}</span>
          </li>
        ))}
      </ul>
      {story.refineActions && story.refineActions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {story.refineActions.map((action) => (
            <button
              key={`${action.stepId}-${action.answerId}`}
              type="button"
              className="text-sm font-medium text-ca-primary underline-offset-2 hover:underline disabled:opacity-60"
              disabled={applyingRefine || !onApplyRefinement}
              onClick={() => onApplyRefinement?.(action.stepId, action.answerId, action.label)}
            >
              {applyingRefine ? "적용 중..." : action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
