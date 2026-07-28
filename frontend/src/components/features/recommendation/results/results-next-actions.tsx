"use client";

import Link from "next/link";
import { useState } from "react";

import { emitOutboundShopClickBestEffort, emitShareAttemptBestEffort } from "@/lib/api/onboarding-events";
import { swagkeyProductLinkLabel } from "@/lib/layout-catalog-links";
import { buildShareUrl, type ShareTastePayload } from "@/lib/share-taste";
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
  /** Non-PII taste card for SHR-01 share link. */
  shareTaste?: ShareTastePayload | null;
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
 * RES-04: Save (retention) + exactly one next-action (shop view MVP).
 * Retake survey is a text link — not a competing CTA.
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
  shareTaste = null,
}: ResultsNextActionsProps) {
  const switchPick = apiPicks.find((row) => row.domain.toLowerCase() === "switch");
  const switchUrl = buildPartSourceUrl(build, "switch", apiPicks, enrichedSourceUrls);
  const shopLabel = "이 조합 샵에서 보기";
  const shopTitle = swagkeyProductLinkLabel("switch", switchPick?.itemId);
  const showIdleHint = authReady && (saveState === "idle" || saveState === "error");
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
    <div
      className="rounded-xl border border-border bg-white dark:bg-ca-surface-container px-4 py-4 sm:px-5"
      data-testid="e2e-results-next-actions"
    >
      <p className="font-headline text-sm font-semibold text-ca-on-surface">결과 보관</p>
      <p className="mt-1 break-keep text-sm text-ca-on-surface-variant">
        나중에 다시 보려면 먼저 저장해 두세요.
      </p>
      <div className="mt-3">
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
      </div>

      {showIdleHint ? (
        <p className="mt-3 break-keep text-sm text-ca-on-surface-variant">
          {isAuthenticated
            ? "계정에 저장하면 마이페이지에서 다시 열 수 있어요."
            : "이 브라우저에 임시 저장돼요. 계정에 보관하려면 로그인하세요."}
        </p>
      ) : null}

      {saveMessage || saveState === "error" || saveState === "saved" ? (
        <div
          className="mt-3 space-y-1 text-sm text-ca-on-surface-variant"
          role={saveState === "error" ? "alert" : "status"}
          aria-live={saveState === "error" ? "assertive" : "polite"}
          data-testid="e2e-save-feedback"
        >
          <p>
            {saveState === "error"
              ? saveMessage?.trim() || "저장하지 못했어요"
              : saveMessage?.trim() ||
                (saveState === "saved"
                  ? isAuthenticated
                    ? "계정에 저장했어요. 마이페이지에서 다시 열 수 있어요."
                    : "이 브라우저에 임시 저장했어요."
                  : "")}
          </p>
          {saveState === "saved" && isAuthenticated ? (
            <Link
              href="/mypage?section=saved"
              className="inline-block font-medium text-ca-primary underline-offset-4 hover:underline"
              data-testid="e2e-save-mypage-link"
            >
              마이페이지에서 다시 보기
            </Link>
          ) : null}
          {saveState === "saved" && !isAuthenticated ? (
            <Link
              href="/auth?mode=login"
              className="inline-block font-medium text-ca-primary underline-offset-4 hover:underline"
              data-testid="e2e-save-login-link"
            >
              계정에 보관하려면 로그인
            </Link>
          ) : null}
        </div>
      ) : null}

      {switchUrl ? (
        <div className="mt-5 border-t border-ca-outline-variant/35 pt-4" data-testid="e2e-results-next-action">
          <p className="font-headline text-sm font-semibold text-ca-on-surface">다음에 할 일</p>
          <p className="mt-1 break-keep text-sm text-ca-on-surface-variant">
            대표 부품을 스웨그키에서 가격·재고를 확인해 보세요.
          </p>
          <a
            href={switchUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`${shopTitle} — 새 탭에서 스웨그키 매장이 열립니다`}
            data-testid="e2e-results-shop-link"
            className={cn(
              buttonClassName({ variant: "outline", size: "default" }),
              "mt-3 min-h-11 w-full justify-center border-ca-outline-variant/50 sm:w-auto",
            )}
            onClick={() => {
              void emitOutboundShopClickBestEffort({
                surface: "results",
                domain: "switch",
                itemId: switchPick?.itemId,
                buildId: build.id,
                href: switchUrl,
              });
            }}
          >
            {shopLabel}
            <span className="text-ca-on-surface-variant"> (새 탭)</span>
          </a>
        </div>
      ) : null}

      {shareTaste ? (
        <div className="mt-5 border-t border-ca-outline-variant/35 pt-4" data-testid="e2e-results-share">
          <p className="font-headline text-sm font-semibold text-ca-on-surface">공유</p>
          <p className="mt-1 break-keep text-sm text-ca-on-surface-variant">
            취향 요약 링크를 복사해 공유할 수 있어요. 계정 정보는 포함되지 않습니다.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 min-h-11 w-full sm:w-auto"
            data-testid="e2e-share-copy"
            onClick={() => void onCopyShareLink()}
          >
            {shareStatus === "copied" ? "링크 복사됨" : "링크 복사"}
          </Button>
          {shareStatus === "error" ? (
            <p className="mt-2 text-sm text-destructive" role="alert">
              클립보드에 복사하지 못했어요. 잠시 후 다시 시도해 주세요.
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-4">
        <Link
          href="/recommend"
          className="inline-flex min-h-11 items-center text-sm text-ca-on-surface-variant underline-offset-4 hover:underline"
          data-testid="e2e-results-retake-link"
        >
          설문 다시 하기
        </Link>
      </p>
    </div>
  );
}
