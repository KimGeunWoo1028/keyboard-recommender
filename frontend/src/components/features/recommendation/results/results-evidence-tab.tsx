"use client";

import { EVIDENCE_STORY_STEPS } from "@/lib/keyboard-terminology";

import { HelpHint } from "./help-hint";
import { ResultsEvidenceContextSection } from "./results-evidence-context-section";
import { ResultsEvidencePickCard } from "./results-evidence-pick-card";
import type { ResultsEvidenceTabProps } from "./results-evidence-types";

export type { ResultsEvidenceTabProps } from "./results-evidence-types";

export function ResultsEvidenceTab({
  submission,
  build,
  apiPicks,
  enrichedSourceUrls,
}: ResultsEvidenceTabProps) {
  return (
    <>
      <ResultsEvidenceContextSection submission={submission} />

      <section className="space-y-4 [content-visibility:auto]" data-testid="e2e-pick-explanations">
        <div className="max-w-3xl space-y-1">
          <p className="font-label text-ca-label-sm font-medium text-ca-secondary">EVIDENCE / PICKS</p>
          <h2 className="inline-flex items-center gap-2 font-headline text-lg font-semibold tracking-tight text-ca-on-surface sm:text-xl">
            <span>후보별 추천 근거</span>
            <HelpHint text="각 후보가 왜 추천됐는지, 어떤 점이 잘 맞는지와 주의할 점을 설명합니다." />
          </h2>
          <p className="text-sm text-ca-on-surface-variant">{EVIDENCE_STORY_STEPS[2].description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {apiPicks.map((row, i) => (
            <ResultsEvidencePickCard
              key={`${row.domain}-${row.itemId}-${i}`}
              row={row}
              index={i}
              build={build}
              apiPicks={apiPicks}
              enrichedSourceUrls={enrichedSourceUrls}
            />
          ))}
        </div>
      </section>
    </>
  );
}
