"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CompatibleLayoutChips } from "@/components/features/catalog/compatible-layout-chips";
import { CatalogDetailPanel } from "@/components/features/catalog/catalog-detail-panel";
import { CatalogPartThumbnail } from "@/components/features/catalog/catalog-part-thumbnail";
import { layoutArchetypeMetadata } from "@/components/features/catalog/layout-diagram/layout-archetype-metadata";
import { LayoutTraitChips } from "@/components/features/catalog/layout-diagram/layout-trait-chips";
import { CatalogPagination } from "@/components/features/catalog/catalog-pagination";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  fetchCatalogList,
  fetchCatalogPart,
  type CatalogFamily,
  type CatalogPartDetail,
  type CatalogPartSummary,
} from "@/lib/api/catalog";
import { getPublicApiBase } from "@/lib/api/client";
import { catalogHref } from "@/lib/catalog-links";
import { layoutSizeFilterLabel } from "@/lib/layout-size";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

const CATALOG_TABS: { id: CatalogFamily; label: string }[] = [
  { id: "switch", label: "스위치" },
  { id: "plate", label: "플레이트" },
  { id: "foam", label: "폼" },
  { id: "layout", label: "레이아웃" },
  { id: "case", label: "케이스/키트" },
  { id: "keycap", label: "키캡" },
];

const CASE_SUBTYPES = [
  { id: "", label: "전체" },
  { id: "kit", label: "Kit" },
  { id: "barebone", label: "Barebone" },
  { id: "complete", label: "Complete" },
  { id: "parts", label: "Parts" },
  { id: "he_kit", label: "HE Kit" },
];

const SWITCH_SUBTYPES = [
  { id: "", label: "전체" },
  { id: "linear", label: "Linear" },
  { id: "tactile", label: "Tactile" },
  { id: "silent", label: "Silent" },
  { id: "click", label: "Click" },
  { id: "magnetic", label: "Magnetic" },
];

const KEYCAP_SUBTYPES = [
  { id: "", label: "Full/Base" },
  { id: "full", label: "Full" },
  { id: "base", label: "Base" },
  { id: "addon", label: "Addon" },
  { id: "all", label: "전체" },
];

function parseFamily(raw: string | null): CatalogFamily {
  if (raw === "plate" || raw === "foam" || raw === "layout" || raw === "case" || raw === "keycap") return raw;
  return "switch";
}

function parsePage(raw: string | null): number {
  const n = Number(raw ?? "1");
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function CatalogPartCard({
  item,
  selected,
  onSelect,
}: {
  item: CatalogPartSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  const layoutMeta = item.family === "layout" && item.referenceLayout ? layoutArchetypeMetadata(item.id) : null;
  const isReferenceLayout = item.family === "layout" && item.referenceLayout === true;
  const layoutSize =
    typeof layoutMeta?.layout_size === "string" ? layoutMeta.layout_size.trim() : "";
  const caseCatalogHref =
    layoutSize.length > 0 ? catalogHref({ family: "case", layoutSize }) : null;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "ca-glass-panel-interactive flex h-full cursor-pointer flex-col overflow-hidden border-ca-outline-variant/40 transition hover:border-ca-primary/40",
        item.family === "layout" ? "min-h-[18rem]" : "min-h-[15rem]",
        selected && "border-ca-primary/50 shadow-ca-glow",
      )}
    >
      <CatalogPartThumbnail
        family={item.family}
        imageUrl={item.imageUrl}
        partId={item.id}
        alt={item.name}
        visualVariant={isReferenceLayout ? "layout-blueprint" : "default"}
      />
      <CardHeader className="space-y-2 border-b-0 pb-3 pt-3">
        <CardTitle className="line-clamp-1 font-headline text-base font-semibold leading-snug text-ca-on-surface">
          {item.name}
        </CardTitle>
        {item.family === "layout" ? (
          isReferenceLayout ? (
            <LayoutTraitChips
              metadata={layoutArchetypeMetadata(item.id)}
              limit={3}
              compact
              className="pt-0.5"
            />
          ) : null
        ) : item.family === "case" ? (
          <CompatibleLayoutChips
            layoutSize={item.layoutSize}
            compatibleLayoutSizes={item.compatibleLayoutSizes}
            limit={3}
            compact
            className="pt-0.5"
          />
        ) : null}
        <CardDescription className="line-clamp-2 text-xs leading-5 text-ca-on-surface-variant">
          {item.description || item.id}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-wrap items-center gap-2 pt-0 text-xs text-ca-on-surface-variant">
        {item.subtype ? <span className="ca-chip">{item.subtype}</span> : null}
        {isReferenceLayout ? <span className="ca-chip">참조 배열</span> : null}
        {item.family === "layout" && !isReferenceLayout ? <span className="ca-chip">기판 상품</span> : null}
        {caseCatalogHref ? (
          <Link
            href={caseCatalogHref}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            className="font-label text-ca-label-sm font-medium text-ca-primary underline-offset-4 hover:underline"
          >
            이 배열 케이스/키트 보기
          </Link>
        ) : (
          <span className="font-label text-ca-label-sm font-medium text-ca-primary">상세 보기</span>
        )}
      </CardContent>
    </Card>
  );
}

export function CatalogBrowseView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const legacyKeycap =
    searchParams.get("mode") === "full" && searchParams.get("category") === "keycap";
  const family: CatalogFamily = legacyKeycap ? "keycap" : parseFamily(searchParams.get("family"));
  const subtype = searchParams.get("subtype") ?? "";
  const layoutSize = searchParams.get("layoutSize") ?? "";
  const searchQuery = searchParams.get("q") ?? "";
  const page = parsePage(searchParams.get("page"));

  const [searchInput, setSearchInput] = useState(searchQuery);
  const searchDebouncedRef = useRef(false);
  const [items, setItems] = useState<CatalogPartSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [partDetail, setPartDetail] = useState<CatalogPartDetail | null>(null);
  const catalogTopRef = useRef<HTMLDivElement>(null);

  const replaceCatalogParams = useCallback(
    (patch: {
      family?: CatalogFamily;
      subtype?: string;
      layoutSize?: string | null;
      q?: string | null;
      page?: number;
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (patch.family !== undefined) params.set("family", patch.family);
      if (patch.subtype !== undefined) {
        if (patch.subtype) params.set("subtype", patch.subtype);
        else params.delete("subtype");
      }
      if (patch.layoutSize !== undefined) {
        const nextLayoutSize = (patch.layoutSize ?? "").trim();
        if (nextLayoutSize) params.set("layoutSize", nextLayoutSize);
        else params.delete("layoutSize");
      }
      if (patch.q !== undefined) {
        const nextQuery = (patch.q ?? "").trim();
        if (nextQuery) params.set("q", nextQuery);
        else params.delete("q");
      }
      if (patch.page !== undefined) {
        if (patch.page > 1) params.set("page", String(patch.page));
        else params.delete("page");
      }
      router.replace(`/catalog?${params.toString()}`, { scroll: false });
      setSelectedId(null);
    },
    [router, searchParams],
  );

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedId(null);
  }, [family, layoutSize, subtype, searchQuery, page]);

  const scrollCatalogToTop = useCallback(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    catalogTopRef.current?.scrollIntoView({ block: "start" });
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + limit, total);

  useEffect(() => {
    if (!searchDebouncedRef.current) {
      searchDebouncedRef.current = true;
      return;
    }
    const trimmed = searchInput.trim();
    if (trimmed === searchQuery) return;
    const handle = window.setTimeout(() => {
      replaceCatalogParams({ q: trimmed, page: 1 });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput, searchQuery, replaceCatalogParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const safePage = Math.max(1, page);
    const nextOffset = (safePage - 1) * PAGE_SIZE;
    try {
      const payload = await fetchCatalogList(family, {
        subtype:
          family === "switch" && subtype
            ? subtype
            : family === "case" && subtype
              ? subtype
              : family === "keycap" && subtype
                ? subtype
                : undefined,
        layoutSize: family === "case" && layoutSize.trim() ? layoutSize.trim() : undefined,
        q: searchQuery || undefined,
        limit: PAGE_SIZE,
        offset: nextOffset,
      });
      setItems(payload.items);
      setTotal(payload.total);
      setLimit(payload.limit);
      setOffset(payload.offset);
      if (!getPublicApiBase()) {
        setError("NEXT_PUBLIC_API_URL이 설정되지 않아 카탈로그를 불러올 수 없습니다.");
      }
    } catch (e) {
      setItems([]);
      setTotal(0);
      setError(e instanceof Error ? e.message : "카탈로그를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [family, layoutSize, subtype, searchQuery, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedId) {
      setPartDetail(null);
      setDetailError(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    const run = async () => {
      try {
        const detail = await fetchCatalogPart(family, selectedId);
        if (!cancelled) {
          setPartDetail(detail);
        }
      } catch (e) {
        if (!cancelled) {
          setPartDetail(null);
          setDetailError(e instanceof Error ? e.message : "상세 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedId, family]);

  const layoutSections = useMemo(() => {
    if (family !== "layout") return null;
    const reference = items.filter((item) => item.referenceLayout);
    const products = items.filter((item) => !item.referenceLayout);
    return [
      { title: "참조 배열", items: reference },
      { title: "기판 상품", items: products },
    ].filter((section) => section.items.length > 0);
  }, [family, items]);

  return (
    <PageShell className="max-w-ca space-y-6 px-ca-margin-mobile sm:px-ca-margin">
      <div ref={catalogTopRef} className="scroll-mt-24 space-y-2">
        <p className="font-label text-ca-label-sm font-medium text-ca-secondary">CATALOG</p>
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-ca-on-surface">부품 카탈로그</h1>
        <p className="text-sm text-ca-on-surface-variant">
          스위치·플레이트·폼·케이스/키트·키캡을 탐색할 수 있습니다. 카드를 클릭하면 traits·metadata·스웨그키
          링크를 볼 수 있어요.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATALOG_TABS.map((tab) => (
          <Button
              key={tab.id}
              type="button"
              variant={family === tab.id ? "primary" : "outline"}
              size="default"
              className={
                family === tab.id
                  ? "h-10 rounded-full px-4 font-headline text-sm font-semibold sm:px-5"
                  : "h-10 rounded-full border-ca-outline-variant/60 px-4 font-headline text-sm font-semibold text-ca-on-surface-variant hover:border-ca-primary/40 hover:bg-ca-primary/10 sm:px-5"
              }
              onClick={() => {
                replaceCatalogParams({
                  family: tab.id,
                  subtype: "",
                  layoutSize: tab.id === "case" ? layoutSize : null,
                  page: 1,
                });
              }}
            >
            {tab.label}
          </Button>
        ))}
      </div>

      {family === "switch" ? (
        <div className="flex flex-wrap gap-2">
          {SWITCH_SUBTYPES.map((row) => (
            <Button
              key={row.id || "all"}
              type="button"
              variant={subtype === row.id ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-8 rounded-full font-body text-sm font-medium")}
              onClick={() => {
                replaceCatalogParams({ subtype: row.id, page: 1 });
              }}
            >
              {row.label}
            </Button>
          ))}
        </div>
      ) : null}

      {family === "keycap" ? (
        <div className="flex flex-wrap gap-2">
          {KEYCAP_SUBTYPES.map((row) => (
            <Button
              key={row.id || "all-keycap"}
              type="button"
              variant={subtype === row.id ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-8 rounded-full font-body text-sm font-medium")}
              onClick={() => {
                replaceCatalogParams({ subtype: row.id, page: 1 });
              }}
            >
              {row.label}
            </Button>
          ))}
        </div>
      ) : null}

      {family === "case" ? (
        <div className="flex flex-wrap gap-2">
          {CASE_SUBTYPES.map((row) => (
            <Button
              key={row.id || "all-case"}
              type="button"
              variant={subtype === row.id ? "secondary" : "ghost"}
              size="sm"
              className={cn("h-8 rounded-full font-body text-sm font-medium")}
              onClick={() => {
                replaceCatalogParams({ subtype: row.id, page: 1 });
              }}
            >
              {row.label}
            </Button>
          ))}
        </div>
      ) : null}

      {family === "case" && layoutSize.trim() ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ca-primary/30 bg-ca-primary/5 px-3 py-2 text-sm">
          <p className="text-ca-on-surface">
            <span className="font-medium text-ca-primary">{layoutSizeFilterLabel(layoutSize)}</span> 호환 케이스/키트
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full"
            onClick={() => {
              replaceCatalogParams({ layoutSize: null, page: 1 });
            }}
          >
            필터 해제
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ca-on-surface-variant">
          {loading ? "불러오는 중…" : `총 ${total}개`}
          {!loading && total > 0 ? ` · ${pageStart}–${pageEnd} 표시` : null}
        </p>
        <div className="w-full sm:max-w-xs sm:shrink-0">
          <Input
            type="search"
            className="ca-input"
            placeholder="이름·ID 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="카탈로그 검색"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && !error && items.length === 0 ? (
        <p className="text-sm text-ca-on-surface-variant">표시할 항목이 없습니다.</p>
      ) : null}

      {layoutSections ? (
        <div className="space-y-8">
          {layoutSections.map((section) => (
            <section key={section.title} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-headline text-lg font-semibold text-ca-on-surface">{section.title}</h2>
                <span className="text-sm text-ca-on-surface-variant">{section.items.length}개</span>
              </div>
              <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item) => (
                  <CatalogPartCard
                    key={item.id}
                    item={item}
                    selected={selectedId === item.id}
                    onSelect={() => setSelectedId(item.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <CatalogPartCard
              key={item.id}
              item={item}
              selected={selectedId === item.id}
              onSelect={() => setSelectedId(item.id)}
            />
          ))}
        </section>
      )}

      <CatalogPagination
        page={page}
        totalPages={totalPages}
        loading={loading}
        onPageChange={(nextPage) => {
          if (nextPage === page) return;
          replaceCatalogParams({ page: nextPage });
          scrollCatalogToTop();
        }}
      />

      <CatalogDetailPanel
        open={selectedId !== null}
        loading={detailLoading}
        error={detailError}
        family={family}
        partDetail={partDetail}
        onClose={() => setSelectedId(null)}
      />
    </PageShell>
  );
}
