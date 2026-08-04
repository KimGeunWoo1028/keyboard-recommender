"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { catalogHref } from "@/lib/catalog-links";
import { Button, buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type OverviewCtaSaveState = "idle" | "saving" | "saved" | "error";

/** Manus overview band — short save label (header keeps full saveButtonLabel). */
export function overviewCtaSaveLabel(params: {
  authReady: boolean;
  isAuthenticated?: boolean;
  saveState: OverviewCtaSaveState;
}): string {
  const { authReady, isAuthenticated = true, saveState } = params;
  if (!authReady) return "로그인 확인 중…";
  if (saveState === "saving") return "저장 중…";
  if (saveState === "saved") return "저장됨 ✓";
  if (saveState === "error") return "다시 저장";
  return isAuthenticated ? "이 결과 저장" : "이 브라우저에 저장";
}

export function overviewCtaBandCopy(params: {
  isAuthenticated: boolean;
  saveState: OverviewCtaSaveState;
  saveMessage?: string;
}): { title: string; subtitle: string } {
  const { isAuthenticated, saveState, saveMessage = "" } = params;

  if (saveState === "error") {
    return {
      title: "저장하지 못했어요",
      subtitle: saveMessage.trim() || "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
    };
  }

  if (saveState === "saved") {
    if (isAuthenticated) {
      return {
        title: "저장했어요",
        subtitle:
          saveMessage.trim() || "마이페이지에서 언제든 이 조합을 다시 열 수 있어요.",
      };
    }
    return {
      title: "이 브라우저에 저장했어요",
      subtitle: saveMessage.trim() || "계정에 보관하려면 로그인하세요.",
    };
  }

  if (!isAuthenticated) {
    return {
      title: "이 조합이 마음에 드시나요?",
      subtitle: "이 브라우저에 저장해 두고, 나중에 로그인하면 계정에도 보관할 수 있어요.",
    };
  }

  return {
    title: "이 조합이 마음에 드시나요?",
    subtitle: "저장해두고 카탈로그에서 실제 제품을 찾아보세요.",
  };
}

const outlineOnIndigo = cn(
  buttonClassName({ variant: "outline", size: "default" }),
  "min-h-11 justify-center border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
);

const primaryOnIndigo =
  "min-h-11 bg-white font-semibold text-primary hover:bg-white/90 dark:text-[rgb(55_48_163)]";

export type ResultsOverviewCtaBandProps = {
  isAuthenticated: boolean;
  authReady?: boolean;
  saveState: OverviewCtaSaveState;
  saveMessage?: string;
  onSaveBuild: () => void;
  className?: string;
};

export function ResultsOverviewCtaBand({
  isAuthenticated,
  authReady = true,
  saveState,
  saveMessage = "",
  onSaveBuild,
  className,
}: ResultsOverviewCtaBandProps) {
  const { title, subtitle } = overviewCtaBandCopy({ isAuthenticated, saveState, saveMessage });
  const showSaveAction = saveState !== "saved";
  const showGuestLogin = !isAuthenticated;
  const showMypage = isAuthenticated && saveState === "saved";
  const showErrorFeedback = saveState === "error";

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl bg-primary p-6 text-primary-foreground dark:bg-[rgb(55_48_163)] sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      data-testid="e2e-overview-cta-band"
    >
      <div className="min-w-0 space-y-1">
        <h2 className="font-headline text-lg font-bold">{title}</h2>
        <p
          className="text-sm text-primary-foreground/90"
          data-testid={showErrorFeedback ? "e2e-save-feedback" : undefined}
          role={showErrorFeedback ? "alert" : undefined}
          aria-live={showErrorFeedback ? "assertive" : undefined}
        >
          {subtitle}
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        {showMypage ? (
          <Link
            href="/mypage?section=saved"
            data-testid="e2e-save-mypage-link"
            className={cn(buttonClassName({ variant: "primary", size: "default" }), primaryOnIndigo)}
          >
            마이페이지에서 보기
          </Link>
        ) : null}

        {showSaveAction ? (
          <Button
            type="button"
            data-testid="e2e-overview-cta-save"
            className={primaryOnIndigo}
            disabled={!authReady || saveState === "saving"}
            loading={saveState === "saving"}
            aria-busy={saveState === "saving" || undefined}
            onClick={() => void onSaveBuild()}
          >
            {overviewCtaSaveLabel({ authReady, isAuthenticated, saveState })}
          </Button>
        ) : null}

        {showGuestLogin ? (
          <Link
            href="/auth?mode=login"
            data-testid="e2e-save-login-link"
            className={outlineOnIndigo}
          >
            로그인
          </Link>
        ) : null}

        <Link
          href={catalogHref({ from: "results" })}
          data-testid="e2e-overview-cta-catalog"
          className={outlineOnIndigo}
        >
          카탈로그 보기
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
