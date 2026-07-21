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
    <PageShell className="max-w-ca space-y-6 px-ca-margin-mobile sm:px-ca-margin">
      {/* SSR hero outside RequireAuth so LCP text paints before /auth/me + hydration. */}
      <div className="space-y-2">
        <p className="font-label text-ca-label-sm font-medium text-ca-secondary">RESULTS</p>
        <h1 className="font-headline text-2xl font-bold tracking-tight text-ca-on-surface sm:text-3xl">
          맞춤 추천 결과
        </h1>
        <p className="max-w-2xl text-sm text-ca-on-surface-variant sm:text-base">
          마지막 단계예요. 추천 후보를 확인하고 빌드를 저장해 보세요.
        </p>
      </div>
      <RequireAuth loadingFallback={<ResultsAuthLoadingShell />}>
        <ResultsView />
      </RequireAuth>
    </PageShell>
  );
}
