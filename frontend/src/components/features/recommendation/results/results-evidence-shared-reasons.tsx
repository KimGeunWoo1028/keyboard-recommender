"use client";

import type { SharedEvidenceReasons } from "./results-evidence-shared-reasons-content";
import { ResultsEvidencePickSection } from "./results-evidence-pick-section";

export type ResultsEvidenceSharedReasonsProps = {
  shared: SharedEvidenceReasons;
};

export function ResultsEvidenceSharedReasons({ shared }: ResultsEvidenceSharedReasonsProps) {
  if (!shared.hasSharedReasons) return null;

  return (
    <section
      className="mt-8 space-y-3 rounded-2xl border border-border bg-ca-surface-container-low px-5 py-5 sm:px-6"
      data-testid="e2e-evidence-shared-reasons"
    >
      <div className="space-y-1">
        <h2 className="font-headline text-lg font-semibold tracking-tight text-ca-on-surface sm:text-xl">
          이 조합을 추천한 이유
        </h2>
        <p className="text-sm text-ca-on-surface-variant">
          여러 부품에 공통으로 적용된 취향 근거입니다. 부품별 차이는 아래 카드에서 확인하세요.
        </p>
      </div>

      {shared.alignmentBullets.length > 0 ? (
        <ResultsEvidencePickSection label="공통 취향 근거">
          <ul className="space-y-1 text-sm leading-relaxed text-foreground">
            {shared.alignmentBullets.map((bullet) => (
              <li key={bullet}>· {bullet}</li>
            ))}
          </ul>
        </ResultsEvidencePickSection>
      ) : null}

      {shared.tradeoffLine ? (
        <ResultsEvidencePickSection label="공통 주의할 점" variant="warning">
          <p className="text-sm leading-relaxed text-warning-on-container">
            {shared.tradeoffLine}
          </p>
        </ResultsEvidencePickSection>
      ) : null}
    </section>
  );
}
