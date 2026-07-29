import Image from "next/image";

const SWITCH_TYPES = [
  { type: "리니어", spec: "LINEAR", desc: "부드럽고 조용한 타건감" },
  { type: "택타일", spec: "TACTILE", desc: "눌리는 느낌이 있는 피드백" },
  { type: "클리키", spec: "CLICKY", desc: "또렷한 클릭음과 피드백" },
] as const;

/**
 * Switch guide — larger cutout with wash, foot shadow, and bottom fade.
 */
export function HomeSwitchGuide() {
  return (
    <section className="overflow-x-clip py-20 sm:py-24" aria-labelledby="home-switch-guide-heading">
      <div className="mx-auto grid max-w-ca grid-cols-1 items-center gap-10 px-ca-margin-mobile sm:px-ca-margin lg:grid-cols-2 lg:gap-12 lg:items-stretch">
        <div className="order-2 relative flex min-h-[22rem] items-center justify-center sm:min-h-[26rem] lg:order-1 lg:min-h-full lg:justify-start">
          {/* Soft wash behind switches — stronger blend into page */}
          <div
            className="pointer-events-none absolute left-[42%] top-[48%] h-[85%] w-[105%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EEEBFF]/90 blur-3xl dark:bg-[#1E1B41]/80"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-[35%] top-[55%] h-[40%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 blur-2xl dark:bg-ca-surface/40"
            aria-hidden
          />

          <div className="relative w-[118%] max-w-2xl -translate-x-1 sm:w-[112%] lg:-ml-8 lg:w-[128%] lg:translate-y-2">
            <div
              className="pointer-events-none absolute bottom-[2%] left-1/2 h-[18%] w-[62%] -translate-x-1/2 rounded-[100%] bg-[rgb(15_15_25_/0.18)] blur-3xl dark:bg-black/45"
              aria-hidden
            />

            {/* Fade all four edges (not just corners) into the page */}
            <div
              className="relative aspect-[3/2] w-full"
              style={{
                maskImage: [
                  "linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%)",
                  "linear-gradient(to bottom, transparent 0%, #000 12%, #000 68%, transparent 100%)",
                ].join(", "),
                WebkitMaskImage: [
                  "linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%)",
                  "linear-gradient(to bottom, transparent 0%, #000 12%, #000 68%, transparent 100%)",
                ].join(", "),
                maskComposite: "intersect",
                WebkitMaskComposite: "source-in",
              }}
            >
              <Image
                src="/brand/hero-switches-cutout.png"
                alt="기계식 키보드 스위치"
                fill
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-contain object-center"
              />
            </div>
          </div>
        </div>

        <div className="order-1 flex flex-col justify-center lg:order-2">
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
