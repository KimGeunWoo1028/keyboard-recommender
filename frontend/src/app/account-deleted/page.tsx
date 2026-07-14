import type { Metadata } from "next";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "회원탈퇴 완료",
};

/** Public confirmation after account deletion (Phase 6). No auth required. */
export default function AccountDeletedPage() {
  return (
    <main
      className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-ca-margin-mobile py-14 sm:px-ca-margin"
      data-testid="e2e-account-deleted"
    >
      <p className="font-label text-ca-label-sm font-medium text-ca-secondary">ACCOUNT</p>
      <h1 className="mt-2 font-headline text-2xl font-semibold tracking-tight text-ca-on-surface sm:text-3xl">
        회원탈퇴가 완료되었습니다
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
        이용해 주셔서 감사합니다. 계정·프로필·저장한 빌드 접근 권한이 삭제되었습니다. 같은 이메일로 다시
        가입하실 수 있습니다.
      </p>
      <div className="mt-8">
        <Link href="/" className={buttonClassName({ className: "rounded-full" })}>
          홈으로
        </Link>
      </div>
    </main>
  );
}
