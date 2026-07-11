import { FeatureGrid } from "@/components/features/home/feature-grid";
import { HomeHero } from "@/components/features/home/hero";
import { HomeLandingObserve } from "@/components/features/home/home-landing-observe";
import { PageShell } from "@/components/layout/page-shell";

export default function HomePage() {
  return (
    <PageShell className="max-w-ca space-y-14 px-ca-margin-mobile sm:px-ca-margin">
      <HomeLandingObserve />
      <HomeHero />
      <div className="space-y-4">
        <div>
          <p className="font-label text-ca-label-sm font-medium text-ca-secondary">CATALOG</p>
          <h2 className="font-headline text-ca-headline-md text-ca-on-surface sm:text-ca-headline-lg">
            추천 구성 안내
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ca-on-surface-variant">
            엔진이 다루는 6개 부품 축입니다. 각 축이 소리·타건에 미치는 역할을 보고, 카탈로그 패밀리로 이동할 수
            있어요.
          </p>
        </div>
        <FeatureGrid />
      </div>
    </PageShell>
  );
}
