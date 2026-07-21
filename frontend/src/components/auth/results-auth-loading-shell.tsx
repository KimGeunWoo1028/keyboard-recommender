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
      <div className="h-24 animate-pulse rounded-xl border border-ca-outline-variant/35 bg-ca-surface-container/40 motion-reduce:animate-none sm:h-28" />
      <div className="h-40 animate-pulse rounded-xl border border-ca-outline-variant/35 bg-ca-surface-container/40 motion-reduce:animate-none sm:h-48" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-xl border border-ca-outline-variant/35 bg-ca-surface-container/40 motion-reduce:animate-none" />
        <div className="h-28 animate-pulse rounded-xl border border-ca-outline-variant/35 bg-ca-surface-container/40 motion-reduce:animate-none" />
      </div>
      <p className="sr-only">로그인 정보를 확인하는 중입니다…</p>
    </div>
  );
}
