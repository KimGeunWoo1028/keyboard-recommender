"use client";

import Link from "next/link";

import { HomeWorkshopPreview } from "@/components/features/home/home-workshop-preview";
import { useAuthHeader } from "@/components/layout/auth-controls";

export function HomeHero() {
  const { user, authChecked } = useAuthHeader();
  const recommendHref = user ? "/recommend" : "/auth?next=/recommend";
  const resultsHref = user ? "/results" : "/auth?next=/results";

  return (
    <section className="relative overflow-hidden rounded-lg border border-ca-outline-variant/30 bg-ca-surface-container-low/60">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 85% 20%, rgb(var(--ca-primary) / 0.18), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 90%, rgb(var(--ca-secondary) / 0.12), transparent 50%), linear-gradient(135deg, rgb(var(--ca-surface-container) / 0.4), transparent)",
        }}
      />
      <div className="relative grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-12 lg:p-12">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-ca-primary/30 bg-ca-primary/10 px-3 py-1 font-label text-ca-label-sm font-medium text-ca-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-ca-primary" aria-hidden />
            맞춤 추천 · 6축 빌드
          </p>

          <h1 className="font-headline text-3xl font-bold tracking-tight text-ca-on-surface sm:text-4xl md:text-5xl md:leading-[1.1]">
            정밀하게 맞춘
            <br />
            <span className="bg-gradient-to-r from-ca-primary to-ca-secondary bg-clip-text text-transparent">
              기계식 마스터리
            </span>
          </h1>

          <p className="max-w-xl text-ca-body-md text-ca-on-surface-variant sm:text-ca-body-lg">
            타건감·사운드 취향을 알려주시면 스위치부터 플레이트, 폼, 케이스, 키캡까지 한 번에
            조합해 드려요. 스웨그키 카탈로그와도 바로 연결됩니다.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={recommendHref}
              className="ca-btn-primary w-full justify-center sm:w-auto"
              aria-busy={!authChecked}
            >
              <WrenchIcon className="h-4 w-4" />
              추천 설문 시작
            </Link>
            <Link href="/catalog" className="ca-btn-ghost w-full justify-center sm:w-auto">
              카탈로그 둘러보기
            </Link>
            <Link
              href={resultsHref}
              className="text-center font-label text-ca-label-sm font-medium text-ca-on-surface-variant underline-offset-4 transition-colors hover:text-ca-on-surface hover:underline sm:text-left"
            >
              최근 결과 보기
            </Link>
          </div>
        </div>

        <HomeWorkshopPreview />
      </div>
    </section>
  );
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.1 2.1-1.8-1.8 2.1-2.1z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
