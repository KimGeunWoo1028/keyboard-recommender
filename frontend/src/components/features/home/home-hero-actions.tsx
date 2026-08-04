"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useAuthHeader } from "@/components/layout/auth-controls";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeHeroActions() {
  const { user, authChecked } = useAuthHeader();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          href="/recommend"
          data-testid="e2e-home-start-survey"
          className={cn(
            buttonClassName({ size: "lg" }),
            "w-full justify-center font-bold shadow-lg shadow-primary/25 sm:w-auto",
          )}
          aria-busy={!authChecked}
        >
          설문 시작
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
        <Link
          href="/catalog"
          prefetch={false}
          className={cn(
            buttonClassName({ variant: "outline", size: "lg" }),
            "w-full justify-center font-semibold sm:w-auto",
          )}
        >
          카탈로그 둘러보기
        </Link>
      </div>
      {!authChecked ? (
        <div className="min-h-[1.25rem]" aria-hidden />
      ) : !user ? (
        <p className="break-keep text-sm text-ca-on-surface-variant" data-testid="e2e-home-guest-trust">
          로그인 없이 설문과 추천 결과를 볼 수 있어요. 계정에 저장하려면 나중에 로그인하세요.
        </p>
      ) : null}
    </div>
  );
}
