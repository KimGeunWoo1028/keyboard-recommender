import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogBrowseView } from "@/components/features/catalog/catalog-browse-view";
import {
  CATALOG_PAGE_SIZE,
  catalogListQueryKey,
  fetchCatalogList,
  type CatalogFamily,
  type CatalogListResponse,
} from "@/lib/api/catalog";

export const metadata: Metadata = {
  title: "부품 카탈로그",
  description: "스위치, 플레이트, 폼, 레이아웃, 케이스, 키캡을 탐색하며 원하는 조합 후보를 비교해 보세요.",
  openGraph: {
    title: "부품 카탈로그 · Keyboard Recommender",
    description: "스위치, 플레이트, 폼, 레이아웃, 케이스, 키캡을 탐색하며 원하는 조합 후보를 비교해 보세요.",
  },
};

function parseFamily(raw: string | undefined): CatalogFamily {
  if (raw === "plate" || raw === "foam" || raw === "layout" || raw === "case" || raw === "keycap") {
    return raw;
  }
  return "switch";
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw ?? "1");
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function parseLayoutBrowseSubtype(raw: string | undefined): "pcb" | "reference" {
  return raw === "reference" ? "reference" : "pcb";
}

async function loadInitialCatalogList(sp: {
  family?: string;
  subtype?: string;
  layoutSize?: string;
  q?: string;
  page?: string;
  mode?: string;
  category?: string;
}): Promise<{ list: CatalogListResponse | null; queryKey: string }> {
  const legacyKeycap = sp.mode === "full" && sp.category === "keycap";
  const family: CatalogFamily = legacyKeycap ? "keycap" : parseFamily(sp.family);
  const subtype = sp.subtype ?? "";
  const layoutBrowseSubtype = parseLayoutBrowseSubtype(subtype);
  const layoutSize = sp.layoutSize ?? "";
  const searchQuery = sp.q ?? "";
  const page = parsePage(sp.page);
  const effectiveSubtype = family === "layout" ? layoutBrowseSubtype : subtype;
  const queryKey = catalogListQueryKey({
    family,
    subtype: effectiveSubtype,
    layoutSize: family === "case" ? layoutSize : "",
    q: searchQuery,
    page,
  });

  try {
    const list = await fetchCatalogList(family, {
      subtype:
        family === "layout"
          ? layoutBrowseSubtype
          : family === "switch" && subtype
            ? subtype
            : family === "case" && subtype
              ? subtype
              : family === "keycap" && subtype
                ? subtype
                : undefined,
      layoutSize: family === "case" && layoutSize.trim() ? layoutSize.trim() : undefined,
      q: searchQuery || undefined,
      limit: CATALOG_PAGE_SIZE,
      offset: (page - 1) * CATALOG_PAGE_SIZE,
      next: { revalidate: 60 },
    });
    return { list, queryKey };
  } catch {
    return { list: null, queryKey };
  }
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    family?: string;
    subtype?: string;
    layoutSize?: string;
    q?: string;
    page?: string;
    mode?: string;
    category?: string;
  }>;
}) {
  const sp = await searchParams;
  const { list, queryKey } = await loadInitialCatalogList(sp);

  return (
    <Suspense
      fallback={
        <p className="p-6 text-sm text-ca-on-surface-variant" aria-live="polite">
          불러오는 중...
        </p>
      }
    >
      <CatalogBrowseView initialList={list} initialQueryKey={queryKey} />
    </Suspense>
  );
}
