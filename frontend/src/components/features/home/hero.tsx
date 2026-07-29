import { ChevronDown } from "lucide-react";

import { HomeHeroActions } from "@/components/features/home/home-hero-actions";
import { HomeHeroKeyboard } from "@/components/features/home/home-hero-keyboard";

/**
 * Home first viewport — oversized cutout keyboard grounded with wash + foot shadow.
 */
export function HomeHero() {
  return (
    <section className="relative flex min-h-[min(92vh,56rem)] w-full items-center overflow-x-clip">
      {/* Full-bleed wash — must sit outside max-w-ca so edges are not clipped */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-[#EEF2FF] to-transparent dark:from-[#1A1836]" />
        <div className="absolute right-[8%] top-1/2 h-[640px] w-[640px] -translate-y-1/2 rounded-full bg-primary/[0.07] blur-3xl dark:bg-primary/15" />
      </div>

      <div className="relative mx-auto grid w-full max-w-ca grid-cols-1 items-center gap-8 px-ca-margin-mobile py-16 sm:px-ca-margin lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] lg:gap-2">
        <div className="animate-fade-up z-10">
          <p className="section-label mb-6">Keyboard Recommender</p>
          <h1 className="font-headline text-5xl font-black leading-[1.05] tracking-tight text-ca-on-surface sm:text-6xl lg:text-7xl">
            취향에 맞는
            <br />
            <span className="text-primary">키보드 조합</span>
          </h1>
          <p className="mt-6 max-w-md break-keep text-lg leading-relaxed text-ca-on-surface-variant">
            취향을 몇 가지 고르면 스위치부터 키캡까지 한 번에 조합해 드려요.
          </p>

          <div className="mb-10 mt-8 flex flex-wrap gap-2">
            {["약 1분", "무료", "로그인 없이 시작"].map((tag) => (
              <span key={tag} className="ca-keycap-badge">
                {tag}
              </span>
            ))}
          </div>

          <HomeHeroActions />
        </div>

        <div className="animate-fade-up animate-fade-up-delay-2 relative flex min-h-[20rem] items-center justify-center sm:min-h-[24rem] lg:min-h-[32rem] lg:justify-end">
          {/* Local glow behind product */}
          <div
            className="pointer-events-none absolute left-1/2 top-[42%] h-[78%] w-[95%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EEEBFF]/85 blur-3xl dark:bg-[#1E1B41]/75"
            aria-hidden
          />

          <div className="relative w-[120%] max-w-none translate-x-3 sm:w-[118%] lg:w-[142%] lg:translate-x-10 lg:translate-y-3">
            {/* Foot shadow — grounds the cutout */}
            <div
              className="pointer-events-none absolute bottom-[4%] left-1/2 h-[14%] w-[78%] -translate-x-1/2 rounded-[100%] bg-[rgb(15_15_25_/0.28)] blur-2xl dark:bg-black/60"
              aria-hidden
            />

            <HomeHeroKeyboard />

            {/* Thin callout — ties product to UI */}
            <div className="absolute left-0 top-[38%] z-10 hidden sm:block lg:left-2">
              <div className="rounded-lg border border-border/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm dark:border-border dark:bg-ca-surface/90">
                <p className="text-[10px] font-medium uppercase tracking-widest text-ca-on-surface-variant">
                  부품 카테고리
                </p>
                <p className="font-headline text-xl font-black leading-none text-primary">6</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 animate-bounce flex-col items-center gap-1 text-ca-on-surface-variant"
        aria-hidden
      >
        <ChevronDown className="h-5 w-5" />
      </div>
    </section>
  );
}
