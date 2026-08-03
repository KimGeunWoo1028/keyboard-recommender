/**
 * Hydration placeholder for /results. Mirrors ResultsPageShell first paint
 * (gray identity band + tab bar + body cards) so footer/content do not jump (CLS).
 */
export function ResultsAuthLoadingShell() {
  return (
    <div data-testid="e2e-results-auth-loading" aria-busy="true" aria-live="polite">
      <div className="border-b border-border bg-[#F8F9FA] dark:bg-[rgb(22_22_35)]">
        <div className="mx-auto max-w-ca px-ca-margin-mobile py-10 sm:px-ca-margin sm:py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-3 w-16 animate-pulse rounded bg-ca-surface-container/70 motion-reduce:animate-none" />
              <div className="h-9 w-[min(100%,20rem)] animate-pulse rounded-md bg-ca-surface-container/70 motion-reduce:animate-none sm:h-10" />
              <div className="flex flex-wrap gap-1.5 pt-1">
                <div className="h-6 w-16 animate-pulse rounded-full bg-ca-surface-container/60 motion-reduce:animate-none" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-ca-surface-container/60 motion-reduce:animate-none" />
                <div className="h-6 w-14 animate-pulse rounded-full bg-ca-surface-container/60 motion-reduce:animate-none" />
              </div>
              <div className="h-10 max-w-3xl animate-pulse rounded bg-ca-surface-container/50 motion-reduce:animate-none" />
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <div className="h-8 w-28 animate-pulse rounded-lg bg-ca-surface-container/60 motion-reduce:animate-none" />
              <div className="flex gap-2">
                <div className="h-10 w-20 animate-pulse rounded-md bg-ca-surface-container/60 motion-reduce:animate-none" />
                <div className="h-10 min-w-[10.5rem] animate-pulse rounded-md bg-ca-surface-container/60 motion-reduce:animate-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-ca-surface">
        <div className="mx-auto max-w-ca px-ca-margin-mobile pt-6 sm:px-ca-margin sm:pt-8">
          <div className="flex h-11 gap-1 border-b border-border" aria-hidden>
            <div className="h-11 w-20 animate-pulse rounded-t bg-ca-surface-container/50 motion-reduce:animate-none" />
            <div className="h-11 w-20 animate-pulse rounded-t bg-ca-surface-container/40 motion-reduce:animate-none" />
            <div className="h-11 w-20 animate-pulse rounded-t bg-ca-surface-container/40 motion-reduce:animate-none" />
          </div>
        </div>
        <div className="mx-auto max-w-ca space-y-4 px-ca-margin-mobile py-8 sm:px-ca-margin sm:py-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-40 animate-pulse rounded-xl border border-ca-outline-variant/35 bg-ca-surface-container/40 motion-reduce:animate-none" />
            <div className="h-40 animate-pulse rounded-xl border border-ca-outline-variant/35 bg-ca-surface-container/40 motion-reduce:animate-none" />
            <div className="hidden h-40 animate-pulse rounded-xl border border-ca-outline-variant/35 bg-ca-surface-container/40 motion-reduce:animate-none sm:block" />
          </div>
        </div>
      </div>
      <p className="sr-only">결과를 불러오는 중입니다…</p>
    </div>
  );
}
