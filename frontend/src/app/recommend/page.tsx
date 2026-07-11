import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { SurveyWizard } from "@/components/features/recommendation/survey-wizard";
import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "추천 설문",
};

export default function RecommendPage() {
  return (
    <PageShell className="flex h-[calc(100dvh-4.25rem)] max-h-[calc(100dvh-4.25rem)] w-full max-w-ca flex-col overflow-hidden !px-ca-margin-mobile !py-3 sm:!px-ca-margin sm:!py-4">
      <RequireAuth>
        <div className="flex min-h-0 flex-1 flex-col">
          <SurveyWizard />
        </div>
      </RequireAuth>
    </PageShell>
  );
}
