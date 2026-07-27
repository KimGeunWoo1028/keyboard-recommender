"use client";

import Link from "next/link";

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
  saveMessage?: string;
  onSaveBuild: () => void;
};

/** Exported for unit/e2e label contracts. */
export function saveButtonLabel(params: {
  authReady: boolean;
  isAuthenticated: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
}): string {
  const { authReady, isAuthenticated, saveState } = params;
  if (!authReady) return "로그인 확인 중…";
  if (saveState === "saving") return "저장 중…";
  if (saveState === "saved") return "저장됨";
  if (saveState === "error") return "다시 저장";
  return isAuthenticated ? "이 결과 저장" : "이 브라우저에 저장";
}

/**
 * Sole primary save CTA on results — save first, shop secondary (outline).
 * Non-sticky so mobile scroll is not competed by a pinned bar.
 */
export function ResultsNextActions({
  build,
  apiPicks,
  enrichedSourceUrls,
  isAuthenticated,
  authReady = true,
  saveState,
  saveScope,
  saveMessage = "",
  onSaveBuild,
}: ResultsNextActionsProps) {
  const switchPick = apiPicks.find((row) => row.domain.toLowerCase() === "switch");
  const switchUrl = buildPartSourceUrl(build, "switch", apiPicks, enrichedSourceUrls);
  const shopLabel = swagkeyProductLinkLabel("switch", switchPick?.itemId);
  const showIdleHint = authReady && (saveState === "idle" || saveState === "error");

  return (
    <div
      className="rounded-xl border border-border bg-white dark:bg-ca-surface-container px-4 py-4 sm:px-5"
      data-testid="e2e-results-next-actions"
    >
      <p className="font-headline text-sm font-semibold text-ca-on-surface">다음에 할 일</p>
      <p className="mt-1 break-keep text-sm text-ca-on-surface-variant">
        먼저 이 결과를 저장해 두고, 필요하면 스웨그키에서 대표 부품 가격·재고를 확인해 보세요.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          data-testid="e2e-save-build"
          variant="primary"
          size="default"
          className="min-h-11 w-full sm:w-auto sm:min-w-[10.5rem]"
          disabled={!authReady || saveState === "saving" || saveState === "saved"}
          loading={saveState === "saving"}
          aria-busy={saveState === "saving" || undefined}
          onClick={() => void onSaveBuild()}
        >
          {saveButtonLabel({ authReady, isAuthenticated, saveState })}
        </Button>
        {switchUrl ? (
          <a
            href={switchUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="새 탭에서 스웨그키 매장이 열립니다"
            data-testid="e2e-results-shop-link"
            className={cn(
              buttonClassName({ variant: "outline", size: "default" }),
              "min-h-11 w-full justify-center border-ca-outline-variant/50 sm:w-auto",
            )}
          >
            {shopLabel}
            <span className="text-ca-on-surface-variant"> (새 탭)</span>
          </a>
        ) : null}
        <Link
          href="/recommend"
          className={cn(
            buttonClassName({ variant: "ghost", size: "default" }),
            "min-h-11 w-full justify-center sm:w-auto",
          )}
        >
          설문 다시 하기
        </Link>
      </div>

      {showIdleHint ? (
        <p className="mt-3 break-keep text-sm text-ca-on-surface-variant">
          {isAuthenticated
            ? "계정에 저장되어 다른 기기에서도 확인할 수 있어요."
            : "이 기기의 브라우저에 저장돼요. 로그인하면 계정에 저장할 수 있어요."}
        </p>
      ) : null}

      {saveMessage || saveState === "error" ? (
        <div
          className="mt-3 space-y-1 text-sm text-ca-on-surface-variant"
          role={saveState === "error" ? "alert" : "status"}
          aria-live={saveState === "error" ? "assertive" : "polite"}
        >
          <p>
            {saveState === "error"
              ? saveMessage?.trim() || "저장하지 못했어요"
              : saveMessage}
          </p>
          {saveState === "saved" ? (
            <Link
              href="/mypage?section=saved"
              className="inline-block font-medium text-ca-primary underline-offset-4 hover:underline"
            >
              저장한 결과 보기
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
