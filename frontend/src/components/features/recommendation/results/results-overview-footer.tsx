"use client";

import Link from "next/link";

export type ResultsOverviewFooterProps = {
  isAuthenticated: boolean;
  saveState?: "idle" | "saving" | "saved" | "error";
  saveMessage?: string;
};

export function ResultsOverviewFooter({
  isAuthenticated,
  saveState = "idle",
  saveMessage = "",
}: ResultsOverviewFooterProps) {
  const showSaveFeedback = saveState === "error" || saveState === "saved" || Boolean(saveMessage?.trim());

  return (
    <div className="space-y-3" data-testid="e2e-overview-footer">
      {showSaveFeedback ? (
        <div
          className="space-y-1 text-sm text-ca-on-surface-variant"
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
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
        {!isAuthenticated ? (
          <Link
            href="/auth?mode=login"
            className="text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline"
            data-testid="e2e-save-login-link"
          >
            계정에 보관하려면 로그인
          </Link>
        ) : null}
        <Link
          href="/recommend"
          className="text-sm text-ca-on-surface-variant underline-offset-4 hover:underline"
          data-testid="e2e-results-retake-link"
        >
          설문 다시 하기
        </Link>
      </div>
    </div>
  );
}
