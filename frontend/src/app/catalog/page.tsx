import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogBrowseView } from "@/components/features/catalog/catalog-browse-view";

export const metadata: Metadata = {
  title: "부품 카탈로그",
};

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <p className="p-6 text-sm text-ca-on-surface-variant" aria-live="polite">
          불러오는 중…
        </p>
      }
    >
      <CatalogBrowseView />
    </Suspense>
  );
}
