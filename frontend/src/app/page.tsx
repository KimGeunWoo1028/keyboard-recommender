import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FeatureGrid } from "@/components/features/home/feature-grid";
import { HomeHero } from "@/components/features/home/hero";
import { HomeLandingObserve } from "@/components/features/home/home-landing-observe";
import { HomeProcessSteps } from "@/components/features/home/home-process-steps";
import { HomeSwitchGuide } from "@/components/features/home/home-switch-guide";
import { HomeWorkshopPreviewGate } from "@/components/features/home/home-workshop-preview-gate";
import { buttonClassName } from "@/components/ui/button";
import { publicPageMetadata } from "@/lib/seo/page-metadata";
import { cn } from "@/lib/utils";

const homeDescription =
  "스위치, 플레이트, 폼, 레이아웃, 케이스, 키캡까지 고려해 나에게 맞는 키보드 구성을 추천합니다.";

export const metadata: Metadata = publicPageMetadata({
  path: "/",
  title: { absolute: "Keyboard Recommender" },
  description: homeDescription,
  openGraphTitle: "Keyboard Recommender",
});

export default function HomePage() {
  return (
    <>
      <HomeLandingObserve />
      {/* Hero owns full-bleed gradient; content column is max-w-ca inside HomeHero */}
      <HomeHero />

      <section className="bg-[#F8F9FA] py-20 dark:bg-[rgb(22_22_35)] sm:py-24" aria-labelledby="home-process-heading">
        <div className="mx-auto max-w-ca px-ca-margin-mobile sm:px-ca-margin">
          <div className="mb-12 sm:mb-14">
            <p className="section-label mb-4">이용 방법</p>
            <h2
              id="home-process-heading"
              className="font-headline text-3xl font-black tracking-tight text-ca-on-surface sm:text-4xl"
            >
              어떻게 맞춰 주나요
            </h2>
          </div>
          <HomeProcessSteps />
        </div>
      </section>

      <section className="py-20 sm:py-24" aria-labelledby="home-preview-heading">
        <div className="mx-auto grid max-w-ca grid-cols-1 items-center gap-12 px-ca-margin-mobile sm:px-ca-margin lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="section-label mb-4">결과 미리보기</p>
            <h2
              id="home-preview-heading"
              className="font-headline text-3xl font-black tracking-tight text-ca-on-surface sm:text-4xl"
            >
              설문 후 받는 결과
            </h2>
            <p className="mt-5 max-w-xl break-keep leading-relaxed text-ca-on-surface-variant">
              조합 · 취향 요약 · 저장까지 한 흐름으로 이어집니다. 소리·타건 취향을 고르면 스위치부터
              키캡까지 한 조합으로 이어 줍니다.
            </p>
            <Link href="/recommend" className={cn(buttonClassName({ size: "default" }), "mt-8 inline-flex font-bold")}>
              설문 시작
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div>
            <HomeWorkshopPreviewGate />
          </div>
        </div>
      </section>

      <section className="bg-[#F8F9FA] py-20 dark:bg-[rgb(22_22_35)] sm:py-24" aria-labelledby="home-parts-heading">
        <div className="mx-auto max-w-ca px-ca-margin-mobile sm:px-ca-margin">
          <div className="mb-12 flex flex-col justify-between gap-4 sm:mb-14 sm:flex-row sm:items-end">
            <div>
              <p className="section-label mb-4">부품 카탈로그</p>
              <h2
                id="home-parts-heading"
                className="font-headline text-3xl font-black tracking-tight text-ca-on-surface sm:text-4xl"
              >
                다루는 부품
              </h2>
              <p className="mt-2 text-ca-on-surface-variant">소리와 타건에 영향을 주는 여섯 축</p>
            </div>
            <Link
              href="/catalog"
              prefetch={false}
              className={cn(buttonClassName({ variant: "outline", size: "default" }), "font-semibold")}
            >
              전체 카탈로그
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <FeatureGrid />
        </div>
      </section>

      <HomeSwitchGuide />

      <section className="bg-primary py-16 dark:bg-[rgb(55_48_163)] sm:py-20">
        <div className="mx-auto max-w-ca px-ca-margin-mobile text-center sm:px-ca-margin">
          <h2 className="font-headline text-3xl font-black tracking-tight text-primary-foreground sm:text-4xl">
            당신의 타건 취향,
            <br />
            1분이면 찾아드립니다
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/90">무료 · 로그인 불필요 · 스위치부터 키캡까지 한 번에</p>
          <Link
            href="/recommend"
            className={cn(
              buttonClassName({ size: "lg" }),
              "mt-8 bg-white font-bold text-primary hover:bg-white/90 hover:opacity-100 dark:bg-white dark:text-[rgb(55_48_163)]",
            )}
          >
            설문 시작
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
