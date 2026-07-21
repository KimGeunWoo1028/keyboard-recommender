"use client";

import Link from "next/link";

import { useAuthHeader } from "@/components/layout/auth-controls";

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

export function HomeHeroActions() {
  const { user, authChecked } = useAuthHeader();
  const recommendHref = user ? "/recommend" : "/auth?next=/recommend";
  const resultsHref = user ? "/results" : "/auth?next=/results";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {/* Keep primary CTA warm; defer catalog/results/auth speculative RSC. */}
      <Link
        href={recommendHref}
        prefetch={user ? undefined : false}
        className="ca-btn-primary w-full justify-center sm:w-auto"
        aria-busy={!authChecked}
      >
        <WrenchIcon className="h-4 w-4" />
        추천 설문 시작
      </Link>
      <Link href="/catalog" prefetch={false} className="ca-btn-ghost w-full justify-center sm:w-auto">
        카탈로그 둘러보기
      </Link>
      <Link
        href={resultsHref}
        prefetch={false}
        className="text-center font-label text-ca-label-sm font-medium text-ca-on-surface-variant underline-offset-4 transition-colors hover:text-ca-on-surface hover:underline sm:text-left"
      >
        최근 결과 보기
      </Link>
    </div>
  );
}
