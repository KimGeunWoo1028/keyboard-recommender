"use client";

import type { RecommendedBuild } from "@/types/recommendation";

import { formatBuildHighlights } from "./results-build-highlights-content";

export type ResultsBuildHighlightsProps = {
  build: RecommendedBuild;
};

export function ResultsBuildHighlights({ build }: ResultsBuildHighlightsProps) {
  const bullets = formatBuildHighlights(build.highlights);
  if (bullets.length === 0) return null;

  return (
    <div
      data-testid="e2e-build-highlights"
      className="rounded-lg border border-ca-outline-variant/30 bg-ca-surface-container/20 px-3 py-2.5 sm:px-4"
    >
      <ul className="space-y-1">
        {bullets.map((line) => (
          <li key={line} className="flex gap-2 text-sm leading-relaxed text-ca-on-surface-variant">
            <span className="shrink-0 text-ca-on-surface" aria-hidden>
              ✓
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
