import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { buttonClassName } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없어요",
  description: "주소가 잘못되었거나 페이지가 이동되었을 수 있어요.",
  robots: { index: false, follow: false },
};

/**
 * App-wide 404 — keeps HTTP 404 (no redirect to home) and matches the dark launch UI.
 * Rendered inside the root layout header/footer chrome.
 */
export default function NotFound() {
  return (
    <PageShell className="flex min-h-[min(70vh,36rem)] max-w-ca flex-col justify-center overflow-x-hidden px-ca-margin-mobile py-14 sm:px-ca-margin sm:py-16">
      <div className="max-w-xl" data-testid="e2e-not-found">
        <p className="font-label text-ca-label-sm font-medium text-ca-secondary">404</p>
        <h1 className="mt-2 font-headline text-2xl font-semibold tracking-tight text-ca-on-surface sm:text-3xl">
          페이지를 찾을 수 없어요
        </h1>
        <p className="mt-3 break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
          주소가 잘못되었거나 페이지가 이동되었을 수 있어요.
          <br className="hidden sm:block" />
          홈으로 돌아가거나 추천 설문을 다시 시작해 주세요.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/"
            className={buttonClassName({
              variant: "primary",
              size: "default",
              className: "min-h-11 w-full justify-center rounded-full sm:w-auto sm:min-w-[10.5rem]",
            })}
          >
            홈으로 돌아가기
          </Link>
          <Link
            href="/recommend"
            className={buttonClassName({
              variant: "outline",
              size: "default",
              className:
                "min-h-11 w-full justify-center rounded-full border-ca-outline-variant/50 sm:w-auto sm:min-w-[10.5rem]",
            })}
          >
            추천 설문 시작
          </Link>
        </div>

        <p className="mt-6">
          <Link
            href="/catalog"
            className="font-label text-ca-label-sm font-medium text-ca-on-surface-variant underline-offset-4 hover:text-ca-on-surface hover:underline"
          >
            카탈로그 둘러보기
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
