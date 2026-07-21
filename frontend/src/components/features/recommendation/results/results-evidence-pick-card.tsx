"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  domainDisplayLabel,
  pickDisplayName,
  pickRowSourceUrl,
} from "./results-build-utils";
import { formatEvidenceRankingWhy } from "./results-evidence-ranking-why-content";
import { EvidencePickSectionSlot } from "./results-evidence-pick-section-slot";
import { ResultsEvidencePickSection, EVIDENCE_PICK_SPEC_BODY_MIN_H } from "./results-evidence-pick-section";
import type { ResultsEvidencePickCardProps } from "./results-evidence-types";
import { SwagkeyProductLink } from "./swagkey-product-link";
import {
  alternativeTagline,
  formatEvidenceDetailLines,
  formatEvidenceTradeoff,
  formatEvidenceWhyLine,
} from "./results-text-utils";

function isRankingWhyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EVIDENCE_RANKING_WHY !== "0";
}

export function ResultsEvidencePickCard({
  row,
  index,
  build,
  apiPicks,
  enrichedSourceUrls,
}: ResultsEvidencePickCardProps) {
  const whyLine = formatEvidenceWhyLine(row.summary, row.whyTraits, pickDisplayName(row), row.domain);
  const tradeoffLine = formatEvidenceTradeoff(row.tradeOffs);
  const productSpecLines = formatEvidenceDetailLines(row.whyTraits, whyLine);
  const alternatives = (row.alternatives ?? []).slice(0, 2);
  const runnerUpScore = alternatives[0]?.score;
  const rankingWhy = isRankingWhyEnabled()
    ? formatEvidenceRankingWhy({
        domain: row.domain,
        pickScore: typeof row.score === "number" ? row.score : Number.NaN,
        runnerUpScore: typeof runnerUpScore === "number" ? runnerUpScore : undefined,
        whyTraits: row.whyTraits,
      })
    : null;
  /** Concrete bullets only in UI; fallback stays hidden (trust layer carries uncertainty). */
  const showRankingWhy = rankingWhy?.mode === "concrete" && rankingWhy.bullets.length > 0;

  return (
    <Card
      className={cn(
        "grid gap-3 rounded-xl border bg-ca-surface-container-lowest px-5 pb-5 shadow-none md:row-span-6 md:grid-rows-subgrid",
        index === 0 ? "border-ca-on-surface/40" : "border-ca-outline-variant/40",
      )}
    >
      <CardHeader className="space-y-2 border-b-0 p-0 pt-5">
        <p className="text-sm font-medium text-ca-on-surface-variant">{domainDisplayLabel(row.domain)}</p>
        <CardTitle className="font-headline text-base font-semibold leading-snug text-ca-on-surface">
          {pickDisplayName(row)}
        </CardTitle>
        <p className="text-sm text-ca-on-surface-variant">
          <SwagkeyProductLink
            href={pickRowSourceUrl(row, build, apiPicks, enrichedSourceUrls)}
            domain={row.domain}
            itemId={row.itemId}
          />
        </p>
      </CardHeader>

      <EvidencePickSectionSlot>
        {whyLine ? (
          <ResultsEvidencePickSection label="왜 추천했나요">
            <p className="text-sm font-medium leading-relaxed text-foreground">{whyLine}</p>
          </ResultsEvidencePickSection>
        ) : null}
      </EvidencePickSectionSlot>

      <EvidencePickSectionSlot>
        {showRankingWhy ? (
          <ResultsEvidencePickSection label="1순위로 선택한 이유" testId="e2e-pick-ranking-why">
            <ul className="space-y-1 text-sm leading-relaxed text-foreground">
              {rankingWhy!.bullets.map((bullet) => (
                <li key={bullet}>✓ {bullet}</li>
              ))}
            </ul>
          </ResultsEvidencePickSection>
        ) : null}
      </EvidencePickSectionSlot>

      <EvidencePickSectionSlot>
        {tradeoffLine ? (
          <ResultsEvidencePickSection label="주의할 점" variant="warning" testId="e2e-pick-tradeoff">
            <p className="text-sm leading-relaxed text-amber-950/90 dark:text-amber-50/90">{tradeoffLine}</p>
          </ResultsEvidencePickSection>
        ) : null}
      </EvidencePickSectionSlot>

      <EvidencePickSectionSlot stretch>
        {productSpecLines.length > 0 ? (
          <ResultsEvidencePickSection
            label="제품 특징"
            testId="e2e-pick-product-specs"
            fillHeight
            bodyClassName={EVIDENCE_PICK_SPEC_BODY_MIN_H}
          >
            <ul className="space-y-1 text-sm leading-relaxed text-foreground">
              {productSpecLines.map((line) => (
                <li key={`spec-${index}-${line}`}>{line}</li>
              ))}
            </ul>
          </ResultsEvidencePickSection>
        ) : null}
      </EvidencePickSectionSlot>

      <EvidencePickSectionSlot>
        {alternatives.length > 0 ? (
          <ResultsEvidencePickSection label="대안 후보" variant="muted">
            <ul className="space-y-2">
              {alternatives.map((alt, altIdx) => (
                <li
                  key={`${row.itemId}-alt-${alt.itemId}`}
                  className="rounded-md border border-ca-outline-variant/40 bg-ca-surface-container/40 p-2"
                >
                  <p className="font-label text-ca-label-sm font-semibold text-ca-secondary">
                    {alternativeTagline(altIdx)}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-ca-on-surface">{pickDisplayName(alt)}</p>
                  <p className="mt-1 text-xs text-ca-on-surface-variant">
                    <SwagkeyProductLink
                      href={pickRowSourceUrl(
                        { domain: row.domain, itemId: alt.itemId, sourceUrl: alt.sourceUrl },
                        build,
                        apiPicks,
                        enrichedSourceUrls,
                      )}
                      domain={row.domain}
                      itemId={alt.itemId}
                    />
                  </p>
                </li>
              ))}
            </ul>
          </ResultsEvidencePickSection>
        ) : null}
      </EvidencePickSectionSlot>
    </Card>
  );
}
