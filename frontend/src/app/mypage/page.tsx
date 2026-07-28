import type { Metadata } from "next";
import { Suspense } from "react";

import { MyPageAuthLoadingShell } from "@/components/auth/mypage-auth-loading-shell";
import { RequireAuth } from "@/components/auth/require-auth";
import { MyPageHub } from "@/components/features/mypage/mypage-hub";
import { privatePageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = privatePageMetadata({
  path: "/mypage",
  title: "마이페이지",
});

export default function MyPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[rgb(248_248_252)] dark:bg-ca-surface-container-low">
      {/* SSR chrome lives in hub when authenticated — Manus full-bleed profile header. */}
      <RequireAuth loadingFallback={<MyPageAuthLoadingShell />}>
        <Suspense fallback={<MyPageAuthLoadingShell />}>
          <MyPageHub />
        </Suspense>
      </RequireAuth>
    </div>
  );
}
