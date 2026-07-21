"use client";

import Link from "next/link";

import { useAuthHeader } from "@/components/layout/auth-controls";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeHeroActions() {
  const { user, authChecked } = useAuthHeader();
  const recommendHref = user ? "/recommend" : "/auth?next=/recommend";
  const resultsHref = user ? "/results" : "/auth?next=/results";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-3">
      <Link
        href={recommendHref}
        prefetch={user ? undefined : false}
        className={cn(buttonClassName({ size: "default" }), "w-full justify-center sm:w-auto")}
        aria-busy={!authChecked}
      >
        추천 설문 시작
      </Link>
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
      <Link
        href={resultsHref}
        prefetch={false}
        className="text-center text-sm font-medium text-ca-on-surface-variant underline-offset-4 transition-colors hover:text-ca-on-surface hover:underline sm:text-left"
      >
        최근 결과 보기
      </Link>
    </div>
  );
}
