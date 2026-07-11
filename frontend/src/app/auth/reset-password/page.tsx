import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordClient } from "@/app/auth/reset-password/reset-password-client";

export const metadata: Metadata = {
  title: "비밀번호 재설정",
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-ca-margin-mobile py-10 text-sm text-ca-on-surface-variant sm:px-ca-margin">
          불러오는 중…
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
