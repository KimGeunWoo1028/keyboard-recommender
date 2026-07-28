"use client";

import { Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import { useState } from "react";

import { emitShareAttemptBestEffort } from "@/lib/api/onboarding-events";
import { buildShareUrl, type ShareTastePayload } from "@/lib/share-taste";
import { Button } from "@/components/ui/button";
import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";

import { saveButtonLabel } from "./results-next-actions";

export function formatPreferenceMatchPercent(submission: SurveySubmission): number | null {
  if (typeof submission.overallConfidence === "number" && Number.isFinite(submission.overallConfidence)) {
    return Math.round(submission.overallConfidence * 100);
  }
  return null;
}

export type ResultsHeaderActionsProps = {
  submission: SurveySubmission;
  build: RecommendedBuild;
  isAuthenticated: boolean;
  authReady?: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
  onSaveBuild: () => void;
  shareTaste?: ShareTastePayload | null;
};

export function ResultsHeaderActions({
  submission,
  build,
  isAuthenticated,
  authReady = true,
  saveState,
  onSaveBuild,
  shareTaste = null,
}: ResultsHeaderActionsProps) {
  const matchPercent = formatPreferenceMatchPercent(submission);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");

  async function onCopyShareLink() {
    if (!shareTaste) return;
    void emitShareAttemptBestEffort({ buildId: build.id });
    try {
      const url = buildShareUrl(window.location.origin, shareTaste);
      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
    } catch {
      setShareStatus("error");
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      {matchPercent !== null ? (
        <div
          className="inline-flex items-center gap-2 self-start rounded-lg bg-primary/10 px-3 py-1.5 sm:self-end"
          data-testid="e2e-preference-match-badge"
        >
          <span className="text-sm font-bold text-primary">취향 일치도 {matchPercent}%</span>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {shareTaste ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 gap-1.5 border-border font-semibold"
            data-testid="e2e-share-copy"
            onClick={() => void onCopyShareLink()}
          >
            <Share2 className="h-4 w-4" aria-hidden />
            {shareStatus === "copied" ? "복사됨" : "공유"}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          className="h-10 gap-1.5 px-4 font-bold"
          data-testid="e2e-save-build"
          disabled={!authReady || saveState === "saving" || saveState === "saved"}
          loading={saveState === "saving"}
          aria-busy={saveState === "saving" || undefined}
          onClick={() => void onSaveBuild()}
        >
          {saveState === "saved" ? (
            <BookmarkCheck className="h-4 w-4" aria-hidden />
          ) : (
            <Bookmark className="h-4 w-4" aria-hidden />
          )}
          {saveButtonLabel({ authReady, isAuthenticated, saveState })}
        </Button>
      </div>
      {shareStatus === "error" ? (
        <p className="text-xs text-destructive" role="alert">
          클립보드에 복사하지 못했어요.
        </p>
      ) : null}
    </div>
  );
}
