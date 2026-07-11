import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthPageClient } from "@/app/auth/auth-page-client";

export const metadata: Metadata = {
  title: "로그인",
};

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-ca-margin-mobile py-10 text-sm text-ca-on-surface-variant sm:px-ca-margin">
          불러오는 중…
        </div>
      }
    >
      <AuthPageClient />
    </Suspense>
  );
}
