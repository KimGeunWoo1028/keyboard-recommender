import type { Metadata } from "next";

import { ResultsView } from "@/components/features/recommendation/results-view";
import { privatePageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = privatePageMetadata({
  path: "/results",
  title: "추천 결과",
  description:
    "설문 취향에 맞춘 키보드 부품 조합 결과입니다. 개인 결과는 검색에 노출되지 않으며, 이 기기에서 확인·저장할 수 있어요.",
  openGraphDescription: "설문 취향에 맞춘 키보드 부품 조합을 확인하고 저장하세요.",
});

export default function ResultsPage() {
  return (
    <div className="bg-[rgb(248_248_252)] dark:bg-ca-surface-container-low">
      <ResultsView />
    </div>
  );
}
