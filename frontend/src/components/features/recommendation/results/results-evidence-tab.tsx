"use client";

import { HelpHint } from "./help-hint";
import { ResultsEvidenceContextSection } from "./results-evidence-context-section";
import { ResultsEvidenceMatchSection } from "./results-evidence-match-section";
import { ResultsEvidencePickCard } from "./results-evidence-pick-card";
import { deriveSharedEvidenceReasons } from "./results-evidence-shared-reasons-content";
import { ResultsEvidenceSharedReasons } from "./results-evidence-shared-reasons";
import type { ResultsEvidenceTabProps } from "./results-evidence-types";

export type { ResultsEvidenceTabProps } from "./results-evidence-types";

export function ResultsEvidenceTab({
  submission,
  build,
  apiPicks,
  enrichedSourceUrls,
}: ResultsEvidenceTabProps) {
  const sharedReasons = deriveSharedEvidenceReasons(apiPicks);

  return (
    <>
      <ResultsEvidenceContextSection submission={submission} />

      <ResultsEvidenceMatchSection submission={submission} apiPicks={apiPicks} />

      <ResultsEvidenceSharedReasons shared={sharedReasons} />

      <section className="mt-8 space-y-4 [content-visibility:auto]" data-testid="e2e-pick-explanations">
        <div className="max-w-3xl space-y-1">
          <h2 className="inline-flex items-center gap-2 font-headline text-lg font-semibold tracking-tight text-ca-on-surface sm:text-xl">
            <span>{sharedReasons.hasSharedReasons ? "부품별 추천 근거" : "후보별 추천 근거"}</span>
            <HelpHint
              text={
                sharedReasons.hasSharedReasons
                  ? "공통 취향은 위에서 확인하고, 각 부품만의 차이와 주의할 점을 아래에서 확인하세요."
                  : "각 후보가 왜 추천됐는지, 어떤 점이 잘 맞는지와 주의할 점을 설명합니다."
              }
            />
          </h2>
          <p className="text-sm text-ca-on-surface-variant">
            {sharedReasons.hasSharedReasons
              ? "부품마다 다른 근거와 제품 특징을 확인하세요. 대안 후보는 카드에서 펼쳐 볼 수 있어요."
              : "각 후보가 왜 추천됐는지, 무엇을 참고하면 좋은지 확인하세요."}
          </p>
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
              sharedReasons={sharedReasons}
            />
          ))}
        </div>
      </section>
    </>
  );
}
