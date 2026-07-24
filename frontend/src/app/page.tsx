import { FeatureGrid } from "@/components/features/home/feature-grid";
import { HomeHero } from "@/components/features/home/hero";
import { HomeLandingObserve } from "@/components/features/home/home-landing-observe";
import { HomeProcessSteps } from "@/components/features/home/home-process-steps";
import { HomeWorkshopPreviewGate } from "@/components/features/home/home-workshop-preview-gate";
import { PageShell } from "@/components/layout/page-shell";

export default function HomePage() {
  return (
    <PageShell className="max-w-ca space-y-12 px-ca-margin-mobile pb-16 sm:px-ca-margin sm:space-y-16 sm:pb-20">
      <HomeLandingObserve />
      <HomeHero />

      <section className="max-w-2xl border-t border-ca-outline-variant/40 pt-8 sm:pt-10" aria-labelledby="home-process-heading">
        <h2 id="home-process-heading" className="font-headline text-lg font-semibold tracking-tight text-ca-on-surface sm:text-xl">
          어떻게 맞춰 주나요
        </h2>
        <div className="mt-5">
          <HomeProcessSteps />
        </div>
      </section>

      <section className="max-w-2xl border-t border-ca-outline-variant/40 pt-8 sm:pt-10" aria-labelledby="home-preview-heading">
        <h2 id="home-preview-heading" className="font-headline text-lg font-semibold tracking-tight text-ca-on-surface sm:text-xl">
          설문 후 받는 결과
        </h2>
        <p className="mt-2 max-w-xl break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
          조합 · 취향 요약 · 저장까지 한 흐름으로 이어집니다.
        </p>
        <div className="mt-5">
          <HomeWorkshopPreviewGate />
        </div>
      </section>

      <section className="border-t border-ca-outline-variant/40 pt-8 sm:pt-10" aria-labelledby="home-parts-heading">
        <div className="max-w-2xl">
          <h2 id="home-parts-heading" className="font-headline text-lg font-semibold tracking-tight text-ca-on-surface sm:text-xl">
            다루는 부품
          </h2>
          <p className="mt-2 max-w-xl break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
            소리와 타건에 영향을 주는 여섯 축 · 카탈로그에서 바로 살펴보세요.
          </p>
        </div>
        <div className="mt-6">
          <FeatureGrid />
        </div>
      </section>
    </PageShell>
  );
}
