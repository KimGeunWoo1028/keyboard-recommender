import type { Metadata } from "next";

import { SurveyWizard } from "@/components/features/recommendation/survey-wizard";
import { publicPageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = publicPageMetadata({
  path: "/recommend",
  title: "추천 설문",
  description: "타건감, 레이아웃, 조합 취향을 바탕으로 나에게 맞는 키보드 구성을 찾는 설문을 시작하세요.",
});

export default function RecommendPage() {
  return (
    <div className="flex min-h-[calc(100dvh-4.25rem)] w-full flex-col overflow-y-auto bg-ca-surface-container-low dark:bg-ca-surface-container sm:h-[calc(100dvh-4.25rem)] sm:max-h-[calc(100dvh-4.25rem)] sm:overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full max-w-ca flex-1 flex-col px-ca-margin-mobile py-6 sm:px-ca-margin sm:py-8">
        <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-ca-surface">
          <SurveyWizard />
        </div>
      </div>
    </div>
  );
}
