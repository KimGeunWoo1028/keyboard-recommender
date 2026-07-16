import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogBrowseView } from "@/components/features/catalog/catalog-browse-view";

export const metadata: Metadata = {
  title: "부품 카탈로그",
  description: "스위치, 플레이트, 폼, 레이아웃, 케이스, 키캡을 탐색하며 원하는 조합 후보를 비교해 보세요.",
  openGraph: {
    title: "부품 카탈로그 · Keyboard Recommender",
    description: "스위치, 플레이트, 폼, 레이아웃, 케이스, 키캡을 탐색하며 원하는 조합 후보를 비교해 보세요.",
  },
};

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <p className="p-6 text-sm text-ca-on-surface-variant" aria-live="polite">
          불러오는 중...
        </p>
      }
    >
      <CatalogBrowseView />
    </Suspense>
  );
}
