"use client";

import { explainMatch } from "@/lib/recommendation-explain";
import type { CatalogItem, ScoredComponent } from "@/recommendation-engine/models";
import type { EngineTraitVector } from "@/recommendation-engine/traits";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { formatScoreBand } from "./results-build-utils";

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
      className={cn(
        "flex h-full flex-col rounded-xl border bg-ca-surface-container-lowest shadow-none",
        topPick ? "border-ca-on-surface/40" : "border-ca-outline-variant/40",
      )}
    >
      <CardHeader className="space-y-3 border-b-0 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-ca-on-surface-variant">{categoryLabel}</p>
            <CardTitle className="font-headline text-base font-semibold leading-snug text-ca-on-surface sm:text-lg">
              {item.name}
            </CardTitle>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge
              className={
                topPick
                  ? "shrink-0 border-ca-on-surface/30 bg-transparent font-medium text-ca-on-surface"
                  : "shrink-0 bg-transparent font-normal"
              }
            >
              #{rank}
              {topPick ? " · 최상위" : ""}
            </Badge>
            <span className="text-xs font-medium text-ca-on-surface-variant">
              {formatScoreBand(score)}
            </span>
          </div>
        </div>
        <CardDescription className="text-sm leading-relaxed text-ca-on-surface-variant">{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-1 flex-col gap-4 pt-0">
        <div className="rounded-lg border border-ca-outline-variant/35 bg-ca-surface-container-lowest px-3 py-2.5">
          <p className="text-sm font-medium text-ca-on-surface">추천 이유</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ca-on-surface-variant">{explanation}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-ca-outline-variant/35 px-3 py-2.5">
            <p className="text-sm font-medium text-ca-on-surface">사운드 성향</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ca-on-surface-variant">{soundSummary}</p>
          </div>
          <div className="rounded-lg border border-ca-outline-variant/35 px-3 py-2.5">
            <p className="text-sm font-medium text-ca-on-surface">타건감</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ca-on-surface-variant">{typingSummary}</p>
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
