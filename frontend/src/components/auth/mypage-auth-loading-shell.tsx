import { DEFAULT_AVATAR_SRC } from "@/lib/avatar";

/**
 * Auth/hydration placeholder for /mypage.
 * Keeps main tall so footer.mt-auto does not jump (CLS), and paints the default
 * avatar early with fetchPriority=high so LCP is not gated on /auth/me + data.
 */
export function MyPageAuthLoadingShell() {
  return (
    <div
      className="flex min-h-[min(70vh,42rem)] w-full flex-col gap-6"
      data-testid="e2e-mypage-auth-loading"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-wrap gap-2">
        <div className="h-10 w-14 animate-pulse rounded-lg bg-ca-surface-container/60" />
        <div className="h-10 w-24 animate-pulse rounded-lg bg-ca-surface-container/40" />
        <div className="h-10 w-14 animate-pulse rounded-lg bg-ca-surface-container/40" />
      </div>

      <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="flex min-h-[22rem] flex-col overflow-hidden rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest sm:min-h-[24rem]">
          <div className="flex items-center justify-between gap-5 border-b border-ca-outline-variant/30 px-5 py-5 sm:gap-8 sm:px-6 sm:py-6">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-7 w-40 animate-pulse rounded bg-ca-surface-container/60" />
              <div className="h-4 w-48 animate-pulse rounded bg-ca-surface-container/40" />
              <div className="mt-1 h-9 w-28 animate-pulse rounded-lg bg-ca-surface-container/50" />
            </div>
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-ca-outline-variant/50 bg-ca-surface-container/60 sm:h-28 sm:w-28">
              {/* eslint-disable-next-line @next/next/no-img-element -- LCP candidate; discoverable before auth data */}
              <img
                src={DEFAULT_AVATAR_SRC}
                alt=""
                width={112}
                height={112}
                className="h-full w-full object-cover"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
            <div className="h-4 w-24 animate-pulse rounded bg-ca-surface-container/50" />
            <div className="h-16 animate-pulse rounded-lg bg-ca-surface-container/40" />
          </div>
        </div>
        <div className="flex min-h-[22rem] flex-col gap-3 rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest p-5 sm:min-h-[24rem] sm:p-6">
          <div className="h-4 w-28 animate-pulse rounded bg-ca-surface-container/50" />
          <div className="h-10 w-14 animate-pulse rounded bg-ca-surface-container/60" />
          <div className="mt-4 h-24 flex-1 animate-pulse rounded-lg bg-ca-surface-container/40" />
        </div>
      </div>
      <p className="sr-only">로그인 정보를 확인하는 중입니다…</p>
    </div>
  );
}
