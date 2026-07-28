import Image from "next/image";
import { ChevronDown } from "lucide-react";

import { HomeHeroActions } from "@/components/features/home/home-hero-actions";

/**
 * Home first viewport — cutout keyboard on page wash (no card frame).
 */
export function HomeHero() {
  return (
    <section className="relative flex min-h-[min(92vh,56rem)] w-full items-center">
      {/* Full-bleed wash — must sit outside max-w-ca so edges are not clipped */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-[#EEF2FF] to-transparent dark:from-[#1A1836]" />
        <div className="absolute right-1/4 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-ca grid-cols-1 items-center gap-10 px-ca-margin-mobile py-16 sm:px-ca-margin lg:grid-cols-2 lg:gap-8">
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

        <div className="animate-fade-up animate-fade-up-delay-2 relative flex justify-center lg:justify-end">
          <div className="relative aspect-[3/2] w-full max-w-xl lg:max-w-none">
            <Image
              src="/brand/hero-keyboard-cutout.png"
              alt="프리미엄 기계식 키보드"
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 44vw"
              className="object-contain object-center drop-shadow-[0_24px_48px_rgba(15,15,25,0.18)] dark:drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)]"
            />
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
