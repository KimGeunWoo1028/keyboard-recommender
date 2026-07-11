"use client";

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
  return (
    <div className="mx-auto max-w-lg space-y-4 px-ca-margin-mobile py-16 sm:px-ca-margin">
      <p className="font-label text-ca-label-sm font-medium text-ca-secondary">ERROR</p>
      <h1 className="font-headline text-2xl font-semibold text-ca-on-surface">문제가 발생했습니다</h1>
      <p className="text-sm text-ca-on-surface-variant">
        {error.message || "알 수 없는 오류입니다. 페이지를 다시 불러와 주세요."}
      </p>
      {error.digest ? (
        <p className="font-label text-xs text-ca-on-surface-variant">digest: {error.digest}</p>
      ) : null}
      <button type="button" onClick={() => reset()} className="ca-btn-primary rounded-full px-5 py-2 text-sm font-semibold">
        다시 시도
      </button>
    </div>
  );
}
