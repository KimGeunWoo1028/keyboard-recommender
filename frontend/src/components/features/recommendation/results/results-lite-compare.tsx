"use client";

import { explainMatch } from "@/lib/recommendation-explain";
import type { CatalogItem, ScoredComponent } from "@/recommendation-engine/models";
import type { EngineTraitVector } from "@/recommendation-engine/traits";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { formatScore } from "./results-build-utils";

function RecommendationCompareCard({
  rank,
  categoryLabel,
  scored,
  userVector,
  soundSummary,
  typingSummary,
}: {
  rank: number;
  categoryLabel: string;
  scored: ScoredComponent<CatalogItem>;
  userVector: EngineTraitVector;
  soundSummary: string;
  typingSummary: string;
}) {
  const { item, score } = scored;
  const explanation = explainMatch(userVector, item.traitMetadata);
  const topPick = rank === 1;

  return (
    <Card
      className={`ca-glass-panel flex h-full flex-col border-ca-outline-variant/40 transition-shadow ${
        topPick ? "border-ca-primary/45 shadow-ca-glow" : ""
      }`}
    >
      <CardHeader className="space-y-3 border-b-0 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="font-label text-ca-label-sm font-medium text-ca-secondary">{categoryLabel}</p>
            <CardTitle className="font-headline text-base leading-snug text-ca-on-surface sm:text-lg">{item.name}</CardTitle>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge
              className={
                topPick
                  ? "shrink-0 border-ca-primary/40 bg-ca-primary/15 font-semibold text-ca-primary"
                  : "shrink-0"
              }
            >
              #{rank}
              {topPick ? " · 최상위 추천" : ""}
            </Badge>
            <span className="font-mono text-[11px] font-medium tabular-nums text-ca-on-surface-variant">
              점수 {formatScore(score)}
            </span>
          </div>
        </div>
        <CardDescription className="text-sm leading-relaxed text-ca-on-surface-variant">{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-1 flex-col gap-4 pt-0">
        <div className="rounded-lg border border-ca-outline-variant/30 bg-ca-surface-container/50 px-3 py-2.5">
          <p className="font-label text-ca-label-sm font-medium text-ca-secondary">추천 이유</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ca-on-surface">{explanation}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container-lowest/40 px-3 py-2.5">
            <p className="font-label text-ca-label-sm font-medium text-ca-secondary">사운드 성향</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ca-on-surface-variant sm:text-sm">{soundSummary}</p>
          </div>
          <div className="rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container-lowest/40 px-3 py-2.5">
            <p className="font-label text-ca-label-sm font-medium text-ca-secondary">타건감</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ca-on-surface-variant sm:text-sm">{typingSummary}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CategorySection({
  title,
  description,
  categoryLabel,
  rows,
  userVector,
  soundSummary,
  typingSummary,
}: {
  title: string;
  description: string;
  categoryLabel: string;
  rows: ScoredComponent<CatalogItem>[];
  userVector: EngineTraitVector;
  soundSummary: string;
  typingSummary: string;
}) {
  return (
    <section className="space-y-4 [content-visibility:auto]">
      <div className="max-w-3xl space-y-1">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="sm:hidden -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
        {rows.map((row, i) => (
          <div key={`mobile-${row.item.id}`} className="w-[88%] shrink-0 snap-start">
            <RecommendationCompareCard
              rank={i + 1}
              categoryLabel={categoryLabel}
              scored={row}
              userVector={userVector}
              soundSummary={soundSummary}
              typingSummary={typingSummary}
            />
          </div>
        ))}
      </div>
      <div className="hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((row, i) => (
          <RecommendationCompareCard
            key={row.item.id}
            rank={i + 1}
            categoryLabel={categoryLabel}
            scored={row}
            userVector={userVector}
            soundSummary={soundSummary}
            typingSummary={typingSummary}
          />
        ))}
      </div>
    </section>
  );
}

export { RecommendationCompareCard };
