"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { catalogHref } from "@/lib/catalog-links";
import { Button, buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Manus overview band — short save label (header keeps full saveButtonLabel). */
export function overviewCtaSaveLabel(params: {
  authReady: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
}): string {
  const { authReady, saveState } = params;
  if (!authReady) return "로그인 확인 중…";
  if (saveState === "saving") return "저장 중…";
  if (saveState === "saved") return "저장됨 ✓";
  if (saveState === "error") return "다시 저장";
  return "저장하기";
}

export type ResultsOverviewCtaBandProps = {
  isAuthenticated: boolean;
  authReady?: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
  onSaveBuild: () => void;
  className?: string;
};

export function ResultsOverviewCtaBand({
  isAuthenticated: _isAuthenticated,
  authReady = true,
  saveState,
  onSaveBuild,
  className,
}: ResultsOverviewCtaBandProps) {
  void _isAuthenticated;

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl bg-primary p-6 text-white sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      data-testid="e2e-overview-cta-band"
    >
      <div className="min-w-0">
        <h2 className="font-headline text-lg font-bold">이 조합이 마음에 드시나요?</h2>
        <p className="mt-1 text-sm text-white/70">저장해두고 카탈로그에서 실제 제품을 찾아보세요.</p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          data-testid="e2e-overview-cta-save"
          className="min-h-11 bg-white font-semibold text-primary hover:bg-white/90"
          disabled={!authReady || saveState === "saving" || saveState === "saved"}
          loading={saveState === "saving"}
          aria-busy={saveState === "saving" || undefined}
          onClick={() => void onSaveBuild()}
        >
          {overviewCtaSaveLabel({ authReady, saveState })}
        </Button>
        <Link
          href={catalogHref({ from: "results" })}
          data-testid="e2e-overview-cta-catalog"
          className={cn(
            buttonClassName({ variant: "outline", size: "default" }),
            "min-h-11 justify-center border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white",
          )}
        >
          카탈로그 보기
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
