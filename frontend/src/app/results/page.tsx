import type { Metadata } from "next";

import { ResultsView } from "@/components/features/recommendation/results-view";
import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "추천 결과",
  description:
    "설문 취향에 맞춘 키보드 부품 조합 결과입니다. 개인 결과는 검색에 노출되지 않으며, 이 기기에서 확인·저장할 수 있어요.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "추천 결과 · Keyboard Recommender",
    description: "설문 취향에 맞춘 키보드 부품 조합을 확인하고 저장하세요.",
  },
};

export default function ResultsPage() {
  return (
    <PageShell className="max-w-ca space-y-8 px-ca-margin-mobile pb-12 sm:px-ca-margin sm:space-y-10 sm:pb-16">
      <div className="max-w-2xl space-y-2">
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-ca-on-surface sm:text-3xl">
          맞춤 추천 결과
        </h1>
        <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
          추천 조합을 확인하고, 마음에 들면 저장해 두세요. 계정 로그인 시 마이페이지에서 다시 볼 수 있어요.
        </p>
      </div>
      <ResultsView />
    </PageShell>
  );
}
