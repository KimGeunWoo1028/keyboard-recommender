import type { Metadata } from "next";

import { SurveyWizard } from "@/components/features/recommendation/survey-wizard";
import { PageShell } from "@/components/layout/page-shell";
import { publicPageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = publicPageMetadata({
  path: "/recommend",
  title: "추천 설문",
  description: "타건감, 레이아웃, 조합 취향을 바탕으로 나에게 맞는 키보드 구성을 찾는 설문을 시작하세요.",
});

export default function RecommendPage() {
  return (
    <PageShell className="flex min-h-[calc(100dvh-4.25rem)] w-full max-w-ca flex-col overflow-y-auto overflow-x-hidden !bg-ca-surface-container-low !px-ca-margin-mobile !py-4 sm:h-[calc(100dvh-4.25rem)] sm:max-h-[calc(100dvh-4.25rem)] sm:overflow-hidden sm:!px-ca-margin sm:!py-6">
      <div className="flex min-h-0 flex-1 flex-col">
        <SurveyWizard />
      </div>
    </PageShell>
  );
}
