import { FeatureGrid } from "@/components/features/home/feature-grid";
import { HomeHero } from "@/components/features/home/hero";
import { HomeLandingObserve } from "@/components/features/home/home-landing-observe";
import { HomeWorkshopPreviewGate } from "@/components/features/home/home-workshop-preview-gate";
import { PageShell } from "@/components/layout/page-shell";

export default function HomePage() {
  return (
    <PageShell className="max-w-ca space-y-16 px-ca-margin-mobile pb-16 sm:px-ca-margin sm:space-y-20 sm:pb-20">
      <HomeLandingObserve />
      <HomeHero />

      <section className="max-w-2xl border-t border-ca-outline-variant/40 pt-10 sm:pt-12" aria-labelledby="home-preview-heading">
        <h2 id="home-preview-heading" className="font-headline text-lg font-semibold tracking-tight text-ca-on-surface sm:text-xl">
          어떻게 맞춰 주나요
        </h2>
        <p className="mt-2 max-w-xl break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
          취향 여섯 가지와 부품 여섯 가지를 이어 하나의 조합을 만듭니다. 점수가 아니라, 설문이 고른 방향입니다.
        </p>
        <div className="mt-6">
          <HomeWorkshopPreviewGate />
        </div>
      </section>

      <section className="border-t border-ca-outline-variant/40 pt-10 sm:pt-12" aria-labelledby="home-parts-heading">
        <div className="max-w-2xl">
          <h2 id="home-parts-heading" className="font-headline text-lg font-semibold tracking-tight text-ca-on-surface sm:text-xl">
            다루는 부품
          </h2>
          <p className="mt-2 max-w-xl break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
            소리와 타건에 영향을 주는 여섯 축입니다. 관심 있는 축부터 카탈로그에서 살펴볼 수 있어요.
          </p>
        </div>
        <div className="mt-8">
          <FeatureGrid />
        </div>
      </section>
    </PageShell>
  );
}
