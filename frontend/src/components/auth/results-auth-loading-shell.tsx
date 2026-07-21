/**
 * Auth/hydration placeholder for /results. Keeps main tall so footer.mt-auto
 * does not jump up then down (CLS). Hero copy lives outside RequireAuth for LCP.
 */
export function ResultsAuthLoadingShell() {
  return (
    <div
      className="flex min-h-[min(70vh,42rem)] w-full flex-col gap-4"
      data-testid="e2e-results-auth-loading"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-20 animate-pulse rounded-2xl border border-ca-outline-variant/30 bg-ca-surface-container/50 sm:h-24" />
      <div className="h-36 animate-pulse rounded-2xl border border-ca-outline-variant/30 bg-ca-surface-container/50 sm:h-44" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-2xl border border-ca-outline-variant/30 bg-ca-surface-container/50 sm:h-36" />
        <div className="h-28 animate-pulse rounded-2xl border border-ca-outline-variant/30 bg-ca-surface-container/50 sm:h-36" />
      </div>
      <p className="sr-only">로그인 정보를 확인하는 중입니다…</p>
    </div>
  );
}
