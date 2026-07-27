import type { Metadata } from "next";
import { Suspense } from "react";

import { MyPageAuthLoadingShell } from "@/components/auth/mypage-auth-loading-shell";
import { RequireAuth } from "@/components/auth/require-auth";
import { MyPageHub } from "@/components/features/mypage/mypage-hub";
import { ManusPageHeader } from "@/components/layout/manus-page-header";
import { PageShell } from "@/components/layout/page-shell";
import { privatePageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = privatePageMetadata({
  path: "/mypage",
  title: "마이페이지",
});

export default function MyPage() {
  return (
    <div className="bg-ca-surface-container-low">
      <PageShell className="max-w-ca space-y-8 px-ca-margin-mobile sm:px-ca-margin">
        {/* SSR chrome outside RequireAuth so title paints before /auth/me + hydration. */}
        <ManusPageHeader
          eyebrow="My Page"
          title="마이페이지"
          description="취향 요약, 저장한 결과, 계정 설정을 관리합니다."
        />
        <RequireAuth loadingFallback={<MyPageAuthLoadingShell />}>
          <Suspense fallback={<MyPageAuthLoadingShell />}>
            <MyPageHub />
          </Suspense>
        </RequireAuth>
      </PageShell>
    </div>
  );
}
