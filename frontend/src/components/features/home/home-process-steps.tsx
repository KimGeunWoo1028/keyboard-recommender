const STEPS = [
  {
    num: "01",
    title: "취향 선택",
    desc: "짧은 설문으로 소리·타건 방향을 고릅니다. 약 1분이면 충분합니다.",
  },
  {
    num: "02",
    title: "조합 추천",
    desc: "스위치부터 키캡까지 취향에 맞는 부품 조합을 한 번에 제안합니다.",
  },
  {
    num: "03",
    title: "저장 또는 탐색",
    desc: "결과를 저장하거나 카탈로그에서 실제 제품을 직접 살펴보세요.",
  },
] as const;

/** Compact 3-step “how it works” — Manus editorial cards. */
export function HomeProcessSteps() {
  return (
    <ol className="grid gap-8 md:grid-cols-3">
      {STEPS.map((step, i) => (
        <li
          key={step.num}
          className={cnDelay(i)}
        >
          <div className="relative border-t-2 border-primary pt-6">
            <span
              className="pointer-events-none absolute -left-2 -top-4 z-0 select-none text-[7rem] font-black leading-none text-primary/[0.06]"
              aria-hidden
            >
              {step.num}
            </span>
            <div className="relative z-10 pt-8">
              <span className="mb-3 block text-xs font-bold uppercase tracking-widest text-primary">
                {step.num}
              </span>
              <h3 className="mb-3 font-headline text-xl font-bold text-ca-on-surface">{step.title}</h3>
              <p className="break-keep leading-relaxed text-ca-on-surface-variant">{step.desc}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function cnDelay(i: number) {
  const delays = ["animate-fade-up", "animate-fade-up animate-fade-up-delay-1", "animate-fade-up animate-fade-up-delay-2"];
  return delays[i] ?? "animate-fade-up";
}
