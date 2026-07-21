import { HomeHeroActions } from "@/components/features/home/home-hero-actions";

/**
 * Home first viewport — one composition (Desk Craft).
 * Preview lives below the fold; brand wordmark stays in the site header.
 */
export function HomeHero() {
  return (
    <section className="home-hero max-w-xl pt-2 sm:pt-4 md:max-w-2xl">
      <p className="font-headline text-sm font-semibold tracking-tight text-ca-on-surface sm:text-base">
        Keyboard Recommender
      </p>

      <h1 className="mt-4 font-headline text-3xl font-semibold tracking-tight text-ca-on-surface sm:mt-5 sm:text-4xl sm:leading-[1.15] md:text-[2.75rem]">
        취향에 맞는
        <br />
        키보드 조합
      </h1>

      <p className="mt-4 max-w-[36rem] break-keep text-base leading-relaxed text-ca-on-surface-variant sm:mt-5 sm:text-lg sm:leading-relaxed">
        짧은 설문으로 소리·타건 취향을 알려주시면, 스위치부터 키캡까지 한 번에 맞춰 드려요. 스웨그키
        판매 제품과도 바로 이어집니다.
      </p>

      <div className="mt-8 sm:mt-10">
        <HomeHeroActions />
      </div>
    </section>
  );
}
