import { ChevronDown } from "lucide-react";

import { HomeHeroActions } from "@/components/features/home/home-hero-actions";
import { HOME_RESULT_PREVIEW_EXAMPLE } from "@/components/features/home/home-result-preview-example";

/**
 * Home first viewport — Manus-style two-column hero.
 * Image slot is layout-only (no asset) until a dedicated hero photo is supplied.
 */
export function HomeHero() {
  const example = HOME_RESULT_PREVIEW_EXAMPLE;

  return (
    <section className="relative flex min-h-[min(92vh,56rem)] w-full items-center">
      {/* Full-bleed wash — must sit outside max-w-ca so edges are not clipped */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-[#EEF2FF] to-transparent dark:from-primary/10" />
        <div className="absolute right-1/4 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-ca grid-cols-1 items-center gap-12 px-ca-margin-mobile py-16 sm:px-ca-margin lg:grid-cols-2 lg:gap-12">
        <div className="animate-fade-up">
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

        <div className="animate-fade-up animate-fade-up-delay-2 relative lg:pl-4">
          <div className="relative rounded-2xl border border-border bg-white shadow-2xl shadow-indigo-200/50 dark:bg-ca-surface-container dark:shadow-primary/10">
            <div className="relative overflow-hidden rounded-2xl">
              {/* Image slot — replace with <Image src=...> when asset is ready */}
              <div
                className="flex aspect-[5/4] w-full items-center justify-center bg-gradient-to-br from-[#EEF2FF] via-[#F8F9FA] to-[#E0E7FF] dark:from-primary/20 dark:via-ca-surface-container dark:to-primary/10"
                role="img"
                aria-label="히어로 키보드 이미지 자리"
              >
                <span className="text-xs font-semibold uppercase tracking-widest text-ca-on-surface-variant/60">
                  Hero image
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-border bg-white/90 p-4 shadow-lg backdrop-blur-md dark:bg-ca-surface-container/90">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">추천 결과 예시</p>
                <p className="mb-2 text-sm font-semibold text-ca-on-surface">{example.title}</p>
                <div className="flex flex-wrap gap-2">
                  {example.parts.map((part) => (
                    <span key={part.family} className="ca-keycap-badge">
                      {part.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -left-2 top-1/3 z-10 hidden rounded-xl border border-border bg-white p-3 shadow-lg dark:bg-ca-surface-container lg:block">
            <p className="text-xs font-medium text-ca-on-surface-variant">부품 카테고리</p>
            <p className="text-2xl font-black text-primary">6</p>
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
