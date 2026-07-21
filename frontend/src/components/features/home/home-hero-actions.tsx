"use client";

import Link from "next/link";

import { useAuthHeader } from "@/components/layout/auth-controls";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeHeroActions() {
  const { user, authChecked } = useAuthHeader();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-3">
      <div className="flex w-full flex-col gap-1.5 sm:w-auto">
        <Link
          href="/recommend"
          className={cn(buttonClassName({ size: "default" }), "w-full justify-center sm:w-auto")}
          aria-busy={!authChecked}
        >
          추천 설문 시작
        </Link>
        {!user ? (
          <p className="break-keep text-sm text-ca-on-surface-variant">
            로그인 없이 설문과 추천 결과를 볼 수 있어요. 계정에 저장하려면 나중에 로그인하세요.
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
