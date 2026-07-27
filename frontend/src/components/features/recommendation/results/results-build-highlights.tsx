"use client";

import { useId, useState } from "react";

import type { RecommendedBuild } from "@/types/recommendation";

import { formatBuildHighlights } from "./results-build-highlights-content";

export type ResultsBuildHighlightsProps = {
  build: RecommendedBuild;
};

/** Compact reason summary; full bullets behind accessible expand. */
export function ResultsBuildHighlights({ build }: ResultsBuildHighlightsProps) {
  const bullets = formatBuildHighlights(build.highlights);
  const panelId = useId();
  const [open, setOpen] = useState(false);

  if (bullets.length === 0) return null;

  const summary = bullets[0] ?? "";

  return (
    <div
      data-testid="e2e-build-highlights"
      className="rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest px-4 py-3 sm:px-5"
    >
      <p className="text-sm font-medium text-ca-on-surface">추천 이유</p>
      <p className="mt-1 break-keep text-sm leading-relaxed text-ca-on-surface-variant">{summary}</p>

      {bullets.length > 1 ? (
        <>
          <button
            type="button"
            className="mt-2 text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "이유 접기" : "이유 더 보기"}
          </button>
          <div
            id={panelId}
            role="region"
            aria-label="추천 이유 상세"
            hidden={!open}
            className={open ? "mt-2 border-t border-ca-outline-variant/35 pt-2" : undefined}
          >
            <ul className="space-y-1.5">
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
        </>
      ) : null}
    </div>
  );
}
