/**
 * Auth-gate placeholder that paints the survey entry copy immediately so LCP
 * is not delayed by /auth/me. Tiles stay as skeletons until RequireAuth resolves.
 */
export function SurveyAuthLoadingShell() {
  return (
    <div
      className="mx-auto flex h-full w-full max-w-ca flex-col gap-6 sm:gap-8"
      data-testid="e2e-survey-auth-loading"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="shrink-0 sm:max-w-xl sm:self-center sm:text-center">
        <h2 className="font-headline text-2xl font-semibold tracking-tight text-ca-on-surface sm:text-3xl">
          취향에 맞는 키보드 찾기
        </h2>
        <p className="mt-3 break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
          가까운 성향을 고르면 일부 문항이 채워집니다. 이어서 약 1분 설문으로 조합을 맞춥니다.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="min-h-[7.5rem] animate-pulse rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container/40 motion-reduce:animate-none sm:min-h-[10rem]"
          />
        ))}
      </div>

      <p className="sr-only">로그인 정보를 확인하는 중입니다…</p>
    </div>
  );
}
