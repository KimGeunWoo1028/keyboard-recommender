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
      className="rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest px-4 py-4 sm:px-5"
    >
      <p className="font-headline text-base font-semibold text-ca-on-surface">{story.headline}</p>
      <p className="mt-1 text-xs leading-relaxed text-ca-on-surface-variant">
        측정값이 아니라, 설문 응답이 얼마나 일관됐는지를 바탕으로 한 안내입니다.
      </p>
      <ul className="mt-3 space-y-2">
        {story.bullets.map((bullet) => (
          <li key={bullet.text} className="flex gap-2 text-sm leading-relaxed text-ca-on-surface-variant">
            <span className="shrink-0 text-ca-on-surface" aria-hidden>
              {bullet.kind === "check" ? "·" : "·"}
            </span>
            <span>{bullet.text}</span>
          </li>
        ))}
      </ul>
      {story.refineActions && story.refineActions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {story.refineActions.map((action) => (
            <button
              key={`${action.stepId}-${action.answerId}`}
              type="button"
              className="text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline disabled:opacity-60"
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
