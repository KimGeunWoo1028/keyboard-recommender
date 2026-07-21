import type { Metadata } from "next";

import { AuthPageClient } from "@/app/auth/auth-page-client";

export const metadata: Metadata = {
  title: "로그인",
};

/**
 * No Suspense gate around the form: ``useSearchParams`` forced a client-only
 * fallback ("불러오는 중…") and delayed the LCP description until hydration.
 * Query params are read from ``window.location`` inside effects instead.
 */
export default function AuthPage() {
  return <AuthPageClient />;
}
