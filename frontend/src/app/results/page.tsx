import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { ResultsAuthLoadingShell } from "@/components/auth/results-auth-loading-shell";
import { ResultsView } from "@/components/features/recommendation/results-view";
import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "추천 결과",
};

export default function ResultsPage() {
  return (
    <PageShell className="max-w-ca space-y-8 px-ca-margin-mobile pb-12 sm:px-ca-margin sm:space-y-10 sm:pb-16">
      {/* SSR hero outside RequireAuth so LCP text paints before /auth/me + hydration. */}
      <div className="max-w-2xl space-y-2">
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-ca-on-surface sm:text-3xl">
          맞춤 추천 결과
        </h1>
        <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
          추천 조합을 확인하고, 마음에 들면 저장해 두세요.
        </p>
      </div>
      <RequireAuth loadingFallback={<ResultsAuthLoadingShell />}>
        <ResultsView />
      </RequireAuth>
    </PageShell>
  );
}
