import type { Metadata } from "next";
import Link from "next/link";

import { ManusPageHeader } from "@/components/layout/manus-page-header";
import { ManusSurfaceCard } from "@/components/layout/manus-surface-card";
import { buttonClassName } from "@/components/ui/button";
import { privatePageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = privatePageMetadata({
  path: "/account-deleted",
  title: "회원탈퇴 완료",
});

/** Public confirmation after account deletion (Phase 6). No auth required. */
export default function AccountDeletedPage() {
  return (
    <main
      className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-ca-margin-mobile py-14 sm:px-ca-margin"
      data-testid="e2e-account-deleted"
    >
      <ManusSurfaceCard className="animate-fade-up space-y-6" padding="lg">
        <ManusPageHeader
          eyebrow="Account"
          title="회원탈퇴가 완료되었습니다"
          description="이용해 주셔서 감사합니다. 계정·프로필·저장한 결과 접근 권한이 삭제되었습니다. 같은 이메일로 다시 가입하실 수 있습니다."
        />
        <div>
          <Link href="/" className={buttonClassName({ className: "h-11 font-semibold" })}>
            홈으로
          </Link>
        </div>
      </ManusSurfaceCard>
    </main>
  );
}
