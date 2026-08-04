"use client";

import Link from "next/link";

/**
 * Segment error boundary (keeps root layout / header).
 * Prefer this over relying solely on global-error for day-to-day failures.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;
  return (
    <div className="mx-auto max-w-lg space-y-4 px-ca-margin-mobile py-16 sm:px-ca-margin">
      <p className="section-label mb-1">오류</p>
      <h1 className="font-headline text-2xl font-semibold text-ca-on-surface">문제가 발생했습니다</h1>
      <p className="break-keep text-sm text-ca-on-surface-variant">
        화면을 불러오는 중 문제가 생겼어요. 다시 시도하거나 설문으로 돌아가 주세요.
      </p>
      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="button"
          onClick={() => reset()}
          className="ca-btn-primary rounded-full px-5 py-2 text-sm font-semibold"
        >
          다시 시도
        </button>
        <Link
          href="/recommend"
          className="inline-flex items-center rounded-full border border-border px-5 py-2 text-sm font-semibold text-ca-on-surface hover:bg-muted"
        >
          설문 시작
        </Link>
      </div>
    </div>
  );
}
