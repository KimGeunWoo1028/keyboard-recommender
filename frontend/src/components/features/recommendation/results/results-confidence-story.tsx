"use client";

import { useId, useState } from "react";

import type { SurveySubmission } from "@/types/survey";

import { deriveConfidenceStory } from "./results-confidence-story-content";

type ApiPick = NonNullable<SurveySubmission["recommendations"]>[number];

export type ResultsConfidenceStoryProps = {
  submission: SurveySubmission;
  apiPicks: ApiPick[];
  applyingRefine?: boolean;
  onApplyRefinement?: (stepId: string, answerId: string, label: string) => void;
};

/**
 * Phase 5: collapsed one-line fit summary + accessible accordion for bullets.
 * Detail content stays in the DOM (hidden when collapsed) — not removed.
 */
export function ResultsConfidenceStory({
  submission,
  apiPicks,
  applyingRefine = false,
  onApplyRefinement,
}: ResultsConfidenceStoryProps) {
  const story = deriveConfidenceStory(submission, apiPicks);
  const panelId = useId();
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!story) return null;

  return (
    <div
      data-testid="e2e-confidence-story"
      className="rounded-xl border border-border bg-white dark:bg-ca-surface-container px-4 py-4 sm:px-5"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-ca-on-surface-variant">취향 반영도</p>
      <p className="mt-1 break-keep text-sm leading-relaxed text-ca-on-surface sm:text-base">{story.support}</p>

      <button
        type="button"
        className="mt-3 text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-expanded={detailsOpen}
        aria-controls={panelId}
        onClick={() => setDetailsOpen((open) => !open)}
      >
        {detailsOpen ? "추천 기준 접기" : "추천 기준 자세히 보기"}
      </button>

      <div
        id={panelId}
        role="region"
        aria-label="추천 기준 상세"
        hidden={!detailsOpen}
        className={detailsOpen ? "mt-3 border-t border-ca-outline-variant/35 pt-3" : undefined}
      >
        <p className="font-headline text-base font-semibold text-ca-on-surface">{story.headline}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-ca-on-surface-variant">
          측정값이 아니라, 설문 응답이 얼마나 일관됐는지를 바탕으로 한 안내입니다.
        </p>
        <ul className="mt-3 space-y-2">
          {story.bullets.map((bullet) => (
            <li key={bullet.text} className="flex gap-2 text-sm leading-relaxed text-ca-on-surface-variant">
              <span className="shrink-0 text-ca-on-surface" aria-hidden>
                ·
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
                className="text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
                disabled={applyingRefine || !onApplyRefinement}
                onClick={() => onApplyRefinement?.(action.stepId, action.answerId, action.label)}
              >
                {applyingRefine ? "적용 중..." : action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
