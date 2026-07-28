"use client";

import { CheckCircle2 } from "lucide-react";

import type { EvidenceMatchRow } from "./results-evidence-match-content";

export type ResultsEvidenceMatchingTableProps = {
  rows: EvidenceMatchRow[];
};

export function ResultsEvidenceMatchingTable({ rows }: ResultsEvidenceMatchingTableProps) {
  if (rows.length === 0) return null;

  return (
    <div
      className="overflow-hidden rounded-xl border-2 border-[rgb(220_220_238)] bg-white dark:border-border dark:bg-ca-surface-container"
      data-testid="e2e-evidence-matching-table"
    >
      <div className="border-b border-[rgb(220_220_238)] bg-[rgb(248_248_252)] px-5 py-3 dark:border-border dark:bg-ca-surface-container-low">
        <p className="text-xs font-bold uppercase tracking-widest text-ca-on-surface-variant">취향 매칭 분석</p>
      </div>
      <div className="divide-y divide-[rgb(220_220_238)] dark:divide-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="text-sm font-semibold text-[rgb(60_60_80)] dark:text-ca-on-surface">{row.label}</span>
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-medium text-ca-on-surface">{row.value}</span>
              {row.match ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
