/**
 * Auth-gate placeholder that paints the survey entry copy immediately so LCP
 * is not delayed by /auth/me. Tiles stay as skeletons until RequireAuth resolves.
 */
export function SurveyAuthLoadingShell() {
  return (
    <div
      className="survey-curator-shell survey-curator-viewport flex h-full w-full flex-col gap-4 sm:gap-6"
      data-testid="e2e-survey-auth-loading"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="shrink-0 text-center">
        <p className="font-label text-[10px] font-bold uppercase tracking-[0.15em] text-ca-primary sm:text-xs">
          Step 01 of 03
        </p>
        <h2 className="mt-3 font-headline text-xl font-bold text-ca-on-surface sm:text-2xl">
          취향에 맞는 키보드 찾기
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
          스타일을 고른 뒤 약 1분 설문으로 추천을 받을 수 있어요.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="min-h-[7.5rem] animate-pulse rounded-2xl border border-ca-outline-variant/40 bg-ca-surface-container/50 sm:min-h-[10rem]"
          />
        ))}
      </div>

      <p className="sr-only">로그인 정보를 확인하는 중입니다…</p>
    </div>
  );
}
