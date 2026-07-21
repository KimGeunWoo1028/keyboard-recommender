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
      className="rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest px-4 py-3 sm:px-5"
    >
      <p className="text-sm font-medium text-ca-on-surface">이 조합의 포인트</p>
      <ul className="mt-2 space-y-1.5">
        {bullets.map((line) => (
          <li key={line} className="flex gap-2 text-sm leading-relaxed text-ca-on-surface-variant">
            <span className="shrink-0 text-ca-on-surface" aria-hidden>
              ·
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
