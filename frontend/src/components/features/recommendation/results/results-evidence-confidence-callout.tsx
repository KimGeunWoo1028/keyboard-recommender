"use client";

import { Info } from "lucide-react";

import type { EvidenceMatchCalloutModel } from "./results-evidence-match-content";

export type ResultsEvidenceConfidenceCalloutProps = {
  callout: EvidenceMatchCalloutModel;
};

export function ResultsEvidenceConfidenceCallout({ callout }: ResultsEvidenceConfidenceCalloutProps) {
  if (!callout.body.trim()) return null;

  return (
    <div
      className="rounded-xl border border-primary/20 bg-[rgb(238_235_255)] p-5 dark:bg-primary/10"
      data-testid="e2e-evidence-confidence-callout"
    >
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="mb-1 text-sm font-semibold text-primary">{callout.title}</p>
          <p className="text-sm leading-relaxed text-[rgb(80_80_100)] dark:text-ca-on-surface-variant">
            {callout.body}
          </p>
        </div>
      </div>
    </div>
  );
}
