"use client";

import { cn } from "@/lib/utils";

import { COMPARE_AXIS_LABELS, type CompareBuildRow } from "./results-compare-content";
import { ResultsCompareScoreBar } from "./results-compare-score-bar";

export type ResultsCompareBuildCardProps = {
  row: CompareBuildRow;
};

export function ResultsCompareBuildCard({ row }: ResultsCompareBuildCardProps) {
  return (
    <article
      className={cn(
        "rounded-xl border-2 bg-white p-5 transition-all dark:bg-ca-surface-container",
        row.isCurrent
          ? "border-primary shadow-md shadow-primary/10"
          : "border-[rgb(220_220_238)] dark:border-border",
      )}
      data-testid={row.isCurrent ? "e2e-compare-current-build" : "e2e-compare-alt-build"}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {row.isCurrent ? (
            <span className="mb-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
              현재 추천
            </span>
          ) : null}
          <h3 className="font-headline text-base font-extrabold leading-snug text-ca-on-surface">{row.name}</h3>
          {row.diffSummary ? (
            <p className="mt-1 break-keep text-sm text-ca-on-surface-variant">{row.diffSummary}</p>
          ) : null}
        </div>
        {row.matchPercent !== null ? (
          <div className="shrink-0 text-right">
            <p className="text-xs text-ca-on-surface-variant">취향 일치도</p>
            <p
              className={cn(
                "text-xl font-extrabold",
                row.isCurrent ? "text-primary" : "text-[rgb(80_80_100)] dark:text-ca-on-surface-variant",
              )}
            >
              {row.matchPercent}%
            </p>
          </div>
        ) : null}
      </div>

      <ul className="mb-4 grid gap-1.5 sm:grid-cols-2" data-testid="e2e-compare-build-parts">
        {row.parts.map((part) => (
          <li
            key={`${row.id}-${part.domain}`}
            className={cn(
              "flex items-baseline gap-2 rounded-md px-2 py-1 text-sm",
              part.changed ? "bg-primary/5 text-ca-on-surface" : "text-ca-on-surface-variant",
            )}
          >
            <span className="w-20 shrink-0 whitespace-nowrap text-xs font-medium text-ca-on-surface-variant">
              {part.label}
            </span>
            <span className={cn("min-w-0 truncate font-medium", part.changed && "text-primary")}>
              {part.name}
              {part.changed ? <span className="ml-1 text-[10px] font-bold uppercase tracking-wide">변경</span> : null}
            </span>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="mb-1.5 text-xs text-[rgb(130_130_150)] dark:text-ca-on-surface-variant">
            {COMPARE_AXIS_LABELS.noise}
          </p>
          <ResultsCompareScoreBar value={row.bars.noise} />
        </div>
        <div>
          <p className="mb-1.5 text-xs text-[rgb(130_130_150)] dark:text-ca-on-surface-variant">
            {COMPARE_AXIS_LABELS.tactile}
          </p>
          <ResultsCompareScoreBar value={row.bars.tactile} />
        </div>
        <div>
          <p className="mb-1.5 text-xs text-[rgb(130_130_150)] dark:text-ca-on-surface-variant">
            {COMPARE_AXIS_LABELS.bottomOut}
          </p>
          <ResultsCompareScoreBar value={row.bars.bottomOut} />
        </div>
      </div>
    </article>
  );
}
