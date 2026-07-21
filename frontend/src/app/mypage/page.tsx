import type { Metadata } from "next";
import { Suspense } from "react";

import { MyPageAuthLoadingShell } from "@/components/auth/mypage-auth-loading-shell";
import { RequireAuth } from "@/components/auth/require-auth";
import { MyPageHub } from "@/components/features/mypage/mypage-hub";
import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "마이페이지",
  robots: { index: false, follow: false },
};

export default function MyPage() {
  return (
    <PageShell className="max-w-ca space-y-8 px-ca-margin-mobile sm:px-ca-margin">
      {/* SSR chrome outside RequireAuth so title paints before /auth/me + hydration. */}
      <header className="space-y-2">
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-ca-on-surface sm:text-3xl">
          마이페이지
        </h1>
        <p className="max-w-xl break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
          취향 스냅샷, 저장한 빌드, 계정 설정을 관리합니다.
        </p>
      </header>
      <RequireAuth loadingFallback={<MyPageAuthLoadingShell />}>
        <Suspense fallback={<MyPageAuthLoadingShell />}>
          <MyPageHub />
        </Suspense>
      </RequireAuth>
    </PageShell>
  );
}
