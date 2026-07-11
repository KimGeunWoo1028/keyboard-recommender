import type { Metadata } from "next";
import { Suspense } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { MyPageHub } from "@/components/features/mypage/mypage-hub";
import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "마이페이지",
};

export default function MyPage() {
  return (
    <PageShell className="max-w-ca px-ca-margin-mobile sm:px-ca-margin">
      <RequireAuth>
        <Suspense
          fallback={
            <p className="text-sm text-ca-on-surface-variant" aria-live="polite">
              불러오는 중…
            </p>
          }
        >
          <MyPageHub />
        </Suspense>
      </RequireAuth>
    </PageShell>
  );
}
