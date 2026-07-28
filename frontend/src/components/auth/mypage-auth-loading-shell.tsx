/** Shared overview/saved grid skeleton (tabs rendered by parent). */
export function MyPageDataLoadingShell({
  testId = "e2e-mypage-data-loading",
}: {
  testId?: string;
}) {
  return (
    <div data-testid={testId} aria-busy="true" aria-live="polite" className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 animate-pulse rounded-xl border-2 border-[rgb(220_220_238)] bg-white dark:border-border dark:bg-ca-surface-container" />
        <div className="h-24 animate-pulse rounded-xl border-2 border-[rgb(220_220_238)] bg-white dark:border-border dark:bg-ca-surface-container" />
      </div>
      <div className="min-h-[16rem] animate-pulse rounded-xl border-2 border-[rgb(220_220_238)] bg-white dark:border-border dark:bg-ca-surface-container" />
      <p className="sr-only">마이페이지 데이터를 불러오는 중입니다…</p>
    </div>
  );
}

/**
 * Auth/hydration placeholder for /mypage.
 * Keeps main tall so footer.mt-auto does not jump (CLS).
 */
export function MyPageAuthLoadingShell() {
  return (
    <div
      className="mx-auto flex min-h-[min(70vh,42rem)] w-full max-w-4xl flex-col gap-6 px-ca-margin-mobile py-8 sm:px-ca-margin"
      data-testid="e2e-mypage-auth-loading"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-28 animate-pulse rounded-none border-b border-[rgb(220_220_238)] bg-white dark:border-border dark:bg-ca-surface" />
      <MyPageDataLoadingShell testId="e2e-mypage-auth-data-loading" />
      <p className="sr-only">로그인 정보를 확인하는 중입니다…</p>
    </div>
  );
}
