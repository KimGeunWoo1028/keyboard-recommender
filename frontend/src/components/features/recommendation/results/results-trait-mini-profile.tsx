"use client";

import type { SurveySubmission } from "@/types/survey";

import {
  fixedAxisBars,
  fixedAxisBarGlyph,
  TRAIT_MINI_PROFILE_MICROCOPY,
} from "./results-trait-display";

export type ResultsTraitMiniProfileProps = {
  submission: SurveySubmission;
};

export function ResultsTraitMiniProfile({ submission }: ResultsTraitMiniProfileProps) {
  const bars = fixedAxisBars(submission.userTraitScores);
  if (!submission.userTraitScores || Object.keys(submission.userTraitScores).length === 0) {
    return null;
  }

  return (
    <div
      data-testid="e2e-trait-mini-profile"
      className="rounded-lg border border-ca-outline-variant/35 bg-ca-surface-container/25 px-3 py-2.5 sm:px-4"
    >
      <p className="text-xs text-ca-on-surface-variant">{TRAIT_MINI_PROFILE_MICROCOPY}</p>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3">
        {bars.map((bar) => (
          <div key={bar.id} className="flex min-w-0 items-center gap-2 text-xs">
            <span className="w-11 shrink-0 font-medium text-ca-on-surface">{bar.label}</span>
            <span
              className="font-label text-[11px] leading-none tracking-tight text-ca-secondary"
              aria-label={`${bar.label} ${bar.filledSegments}/5`}
            >
              {fixedAxisBarGlyph(bar.filledSegments)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
