"use client";

import { swagkeyProductLinkLabel } from "@/lib/layout-catalog-links";
import { cn } from "@/lib/utils";
import { Button, buttonClassName } from "@/components/ui/button";
import type { RecommendedBuild } from "@/types/recommendation";

import { buildPartSourceUrl } from "./results-build-utils";

type ApiPick = {
  domain: string;
  itemId: string;
  itemName?: string;
  sourceUrl?: string;
};

export type ResultsNextActionsProps = {
  build: RecommendedBuild;
  apiPicks: ApiPick[];
  enrichedSourceUrls: Record<string, string>;
  isAuthenticated: boolean;
  /** False while AuthHeaderProvider is still resolving /auth/me. */
  authReady?: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
  saveScope?: "account" | "local" | null;
  onSaveBuild: () => void;
};

function saveButtonLabel(params: {
  authReady: boolean;
  isAuthenticated: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
  saveScope?: "account" | "local" | null;
}): string {
  const { authReady, isAuthenticated, saveState, saveScope } = params;
  if (!authReady) return "로그인 확인 중…";
  if (saveState === "saving") return "저장 중…";
  if (saveState === "saved") {
    return saveScope === "account" ? "마이페이지에 저장됨" : "이 기기에 저장됨";
  }
  return isAuthenticated ? "이 빌드 저장" : "로컬에 저장";
}

/**
 * Primary result actions after summary + short reasons, before long detail tabs.
 * Intentionally non-sticky so mobile scroll is not competed by a pinned bar.
 */
export function ResultsNextActions({
  build,
  apiPicks,
  enrichedSourceUrls,
  isAuthenticated,
  authReady = true,
  saveState,
  saveScope,
  onSaveBuild,
}: ResultsNextActionsProps) {
  const switchPick = apiPicks.find((row) => row.domain.toLowerCase() === "switch");
  const switchUrl = buildPartSourceUrl(build, "switch", apiPicks, enrichedSourceUrls);

  return (
    <div
      className="rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest px-4 py-4 sm:px-5"
      data-testid="e2e-results-next-actions"
    >
      <p className="font-headline text-sm font-semibold text-ca-on-surface">다음에 할 일</p>
      <p className="mt-1 break-keep text-sm text-ca-on-surface-variant">
        조합이 맞으면 저장해 두고, 대표 부품은 매장에서 바로 확인해 보세요. 매장 링크는 새 탭에서
        열리며, 돌아와 저장하면 이 결과를 다시 찾기 쉬워요.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          data-testid="e2e-save-build-primary"
          size="default"
          className="w-full sm:w-auto"
          disabled={!authReady || saveState === "saving" || saveState === "saved"}
          aria-busy={saveState === "saving" || undefined}
          onClick={() => void onSaveBuild()}
        >
          {saveButtonLabel({ authReady, isAuthenticated, saveState, saveScope })}
        </Button>
        {switchUrl ? (
          <a
            href={switchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonClassName({ variant: "outline", size: "default" }),
              "w-full justify-center sm:w-auto",
            )}
          >
            {swagkeyProductLinkLabel("switch", switchPick?.itemId)}
          </a>
        ) : null}
      </div>
    </div>
  );
}
