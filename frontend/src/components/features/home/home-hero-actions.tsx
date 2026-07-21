"use client";

import Link from "next/link";

import { useAuthHeader } from "@/components/layout/auth-controls";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeHeroActions() {
  const { user, authChecked } = useAuthHeader();
  const recommendHref = user ? "/recommend" : "/auth?next=/recommend";
  const surveyCtaLabel = user ? "추천 설문 시작" : "로그인 후 설문 시작";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-3">
      <div className="flex w-full flex-col gap-1.5 sm:w-auto">
        <Link
          href={recommendHref}
          prefetch={user ? undefined : false}
          className={cn(buttonClassName({ size: "default" }), "w-full justify-center sm:w-auto")}
          aria-busy={!authChecked}
        >
          {surveyCtaLabel}
        </Link>
        {!user ? (
          <p className="break-keep text-sm text-ca-on-surface-variant">
            설문·결과 저장은 로그인이 필요합니다. 카탈로그는 로그인 없이 볼 수 있어요.
          </p>
        ) : null}
      </div>
      <Link
        href="/catalog"
        prefetch={false}
        className={cn(
          buttonClassName({ variant: "outline", size: "default" }),
          "w-full justify-center sm:w-auto",
        )}
      >
        카탈로그 둘러보기
      </Link>
    </div>
  );
}
