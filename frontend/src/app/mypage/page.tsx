import type { Metadata } from "next";
import { Suspense } from "react";

import { MyPageAuthLoadingShell } from "@/components/auth/mypage-auth-loading-shell";
import { RequireAuth } from "@/components/auth/require-auth";
import { MyPageHub } from "@/components/features/mypage/mypage-hub";
import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "마이페이지",
};

export default function MyPage() {
  return (
    <PageShell className="max-w-ca space-y-6 px-ca-margin-mobile sm:px-ca-margin">
      {/* SSR chrome outside RequireAuth so title paints before /auth/me + hydration. */}
      <div className="space-y-2">
        <p className="font-label text-ca-label-sm font-medium text-ca-secondary">WORKSHOP</p>
        <h1 className="font-headline text-2xl font-bold tracking-tight text-ca-on-surface sm:text-3xl">
          마이페이지
        </h1>
        <p className="max-w-2xl text-sm text-ca-on-surface-variant">
          취향 스냅샷, 저장한 빌드, 계정 설정을 한곳에서 관리하세요.
        </p>
      </div>
      <RequireAuth loadingFallback={<MyPageAuthLoadingShell />}>
        <Suspense fallback={<MyPageAuthLoadingShell />}>
          <MyPageHub />
        </Suspense>
      </RequireAuth>
    </PageShell>
  );
}
