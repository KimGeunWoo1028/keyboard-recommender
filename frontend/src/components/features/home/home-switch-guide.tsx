import Image from "next/image";

const SWITCH_TYPES = [
  { type: "리니어", spec: "LINEAR", desc: "부드럽고 조용한 타건감" },
  { type: "택타일", spec: "TACTILE", desc: "눌리는 느낌이 있는 피드백" },
  { type: "클리키", spec: "CLICKY", desc: "또렷한 클릭음과 피드백" },
] as const;

/**
 * Manus Switch Guide layout — switch product photo + type list.
 */
export function HomeSwitchGuide() {
  return (
    <section className="py-20 sm:py-24" aria-labelledby="home-switch-guide-heading">
      <div className="mx-auto grid max-w-ca grid-cols-1 items-center gap-12 px-ca-margin-mobile sm:px-ca-margin lg:grid-cols-2 lg:gap-16">
        <div className="order-2 rounded-2xl border border-border bg-white shadow-xl dark:bg-ca-surface-container lg:order-1">
          <div className="overflow-hidden rounded-2xl">
            <div className="relative aspect-[5/4] w-full">
              <Image
                src="/brand/switches-hero.png"
                alt="기계식 키보드 스위치"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <p className="section-label mb-4">Switch Guide</p>
          <h2
            id="home-switch-guide-heading"
            className="font-headline text-3xl font-black tracking-tight text-ca-on-surface sm:text-4xl"
          >
            스위치가 전부를
            <br />
            결정합니다
          </h2>
          <p className="mt-5 max-w-xl break-keep leading-relaxed text-ca-on-surface-variant">
            리니어, 택타일, 클리키 — 세 가지 유형 중 어느 것이 당신의 취향인지 설문을 통해 정확하게
            찾아드립니다.
          </p>
          <div className="mt-6 space-y-3">
            {SWITCH_TYPES.map((sw) => (
              <div
                key={sw.type}
                className="flex items-center gap-4 rounded-md border border-border border-l-4 border-l-primary bg-white p-4 dark:bg-ca-surface-container"
              >
                <div className="flex min-w-[5.5rem] flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ca-on-surface-variant">
                    {sw.spec}
                  </span>
                  <span className="font-headline font-black text-ca-on-surface">{sw.type}</span>
                </div>
                <div className="h-8 w-px shrink-0 bg-border" aria-hidden />
                <span className="text-sm text-ca-on-surface-variant">{sw.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
