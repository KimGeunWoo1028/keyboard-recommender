import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function HomeWorkshopPreviewShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Light guest panel — experience preview (Home IA). Visible on all breakpoints. */
export function HomeWorkshopGuestPreview() {
  return (
    <HomeWorkshopPreviewShell>
      <p className="font-headline text-base font-semibold text-ca-on-surface sm:text-lg">
        취향 여섯 · 부품 여섯
      </p>
      <p className="mt-2 break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
        설문으로 소리·누르는 힘·걸리는 느낌·되튐·또렷함을 고르면, 스위치부터 키캡까지 이어 붙입니다.
      </p>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-ca-on-surface">취향 (쉬운 말)</dt>
          <dd className="mt-1 break-keep text-ca-on-surface-variant">
            소리 크기 · 누르는 힘 · 걸리는 느낌 · 되튐 · 또렷함 · 선명함
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ca-on-surface">부품</dt>
          <dd className="mt-1 break-keep text-ca-on-surface-variant">
            스위치 · 플레이트 · 폼 · 레이아웃 · 케이스 · 키캡
          </dd>
        </div>
      </dl>
    </HomeWorkshopPreviewShell>
  );
}
