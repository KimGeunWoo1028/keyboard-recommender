const STEPS = [
  {
    n: "1",
    title: "취향 선택",
    body: "짧은 설문으로 소리·타건 방향을 고릅니다.",
  },
  {
    n: "2",
    title: "조합 추천",
    body: "스위치부터 키캡까지 한 줄로 맞춰 드립니다.",
  },
  {
    n: "3",
    title: "저장 또는 탐색",
    body: "결과를 저장하거나 카탈로그에서 실제 제품을 봅니다.",
  },
] as const;

/** Compact 3-step “how it works” — one job, no card clutter. */
export function HomeProcessSteps() {
  return (
    <ol className="grid gap-5 sm:grid-cols-3 sm:gap-6">
      {STEPS.map((step) => (
        <li key={step.n} className="min-w-0">
          <p className="font-headline text-sm font-semibold tabular-nums text-ca-on-surface-variant">
            {step.n}
          </p>
          <p className="mt-1.5 font-headline text-base font-semibold text-ca-on-surface">{step.title}</p>
          <p className="mt-1 break-keep text-sm leading-relaxed text-ca-on-surface-variant">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
