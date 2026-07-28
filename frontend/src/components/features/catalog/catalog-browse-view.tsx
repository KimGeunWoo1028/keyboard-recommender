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
import { Button, buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CATALOG_PAGE_SIZE,
  catalogListQueryKey,
  fetchCatalogList,
  fetchCatalogPart,
  type CatalogFamily,
  type CatalogListResponse,
  type CatalogPartDetail,
  type CatalogPartSummary,
} from "@/lib/api/catalog";
import { getPublicApiBase, ApiError } from "@/lib/api/client";
import { emitOutboundShopClickBestEffort } from "@/lib/api/onboarding-events";
import { catalogHref } from "@/lib/catalog-links";
import { isReferenceOnlyLayoutArchetype } from "@/lib/layout-catalog-links";
import { layoutSizeFilterLabel } from "@/lib/layout-size";
import { normalizeSwagkeyProductUrl } from "@/lib/swagkey-source-links";
import { cn } from "@/lib/utils";

const PAGE_SIZE = CATALOG_PAGE_SIZE;

const FAMILY_LABELS: Record<CatalogFamily, string> = {
  switch: "스위치",
  plate: "플레이트",
  foam: "폼",
  layout: "레이아웃",
  case: "케이스/키트",
  keycap: "키캡",
};

function catalogLoadErrorMessage(err: unknown): string {
  if (err instanceof ApiError && (err.status === 502 || err.status === 503 || err.status === 504 || err.status === 0)) {
    return "서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 검색해 주세요.";
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return "카탈로그를 불러오지 못했습니다.";
}

/** 1차 필터: 실제 시드 부품군 (사이트 카테고리 미러가 아님). */
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
  { id: "kit", label: "키트" },
  { id: "barebone", label: "베어본" },
  { id: "complete", label: "완제품" },
  { id: "parts", label: "파츠" },
  { id: "he_kit", label: "HE 키트" },
];

const SWITCH_SUBTYPES = [
  { id: "", label: "전체" },
  { id: "linear", label: "리니어" },
  { id: "tactile", label: "텍타일" },
  { id: "silent", label: "무소음" },
  { id: "click", label: "클릭" },
  { id: "magnetic", label: "마그네틱" },
];

const KEYCAP_SUBTYPES = [
  { id: "", label: "풀/베이스" },
  { id: "full", label: "풀세트" },
  { id: "base", label: "베이스" },
  { id: "addon", label: "애드온" },
  { id: "all", label: "전체" },
];

/** Layout browse tabs — no "전체"; default is PCB products. */
const LAYOUT_SUBTYPES = [
  { id: "pcb", label: "기판" },
  { id: "reference", label: "참조 배열" },
] as const;

type LayoutBrowseSubtype = (typeof LAYOUT_SUBTYPES)[number]["id"];

function parseLayoutBrowseSubtype(raw: string | null): LayoutBrowseSubtype {
  return raw === "reference" ? "reference" : "pcb";
}

function parseFamily(raw: string | null): CatalogFamily {
  if (raw === "plate" || raw === "foam" || raw === "layout" || raw === "case" || raw === "keycap") return raw;
  return "switch";
}

function parsePage(raw: string | null): number {
  const n = Number(raw ?? "1");
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function subtypeLabel(family: CatalogFamily, subtype: string): string | null {
  if (!subtype) return null;
  if (family === "layout") {
    return LAYOUT_SUBTYPES.find((row) => row.id === subtype)?.label ?? subtype;
  }
  if (family === "switch") {
    return SWITCH_SUBTYPES.find((row) => row.id === subtype)?.label ?? subtype;
  }
  if (family === "keycap") {
    return KEYCAP_SUBTYPES.find((row) => row.id === subtype)?.label ?? subtype;
  }
  if (family === "case") {
    return CASE_SUBTYPES.find((row) => row.id === subtype)?.label ?? subtype;
  }
  return subtype;
}

function isSecondarySubtypeActive(family: CatalogFamily, subtype: string): boolean {
  if (family === "layout") return subtype === "reference";
  if (family === "switch" || family === "case" || family === "keycap") return Boolean(subtype);
  return false;
}

function CatalogPartCard({
  item,
  selected,
  onSelect,
  priority = false,
}: {
  item: CatalogPartSummary;
  selected: boolean;
  onSelect: () => void;
  priority?: boolean;
}) {
  const layoutMeta = item.family === "layout" && item.referenceLayout ? layoutArchetypeMetadata(item.id) : null;
  const isReferenceLayout = item.family === "layout" && item.referenceLayout === true;
  const isReferenceOnlyLayout = isReferenceLayout && isReferenceOnlyLayoutArchetype(item.id);
  const layoutSize =
    typeof layoutMeta?.layout_size === "string" ? layoutMeta.layout_size.trim() : "";
  const caseCatalogHref =
    layoutSize.length > 0 ? catalogHref({ family: "case", layoutSize }) : null;
  const retailerUrl = normalizeSwagkeyProductUrl(item.sourceUrl);
  const tagLabel =
    item.subtype && item.family !== "layout" && item.subtype.trim().toLowerCase() !== "other"
      ? subtypeLabel(item.family, item.subtype) ?? item.subtype
      : null;

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
        "flex h-full min-h-[16.5rem] cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:border-primary/40 hover:shadow-md dark:bg-ca-surface-container",
        selected && "border-ca-on-surface/50 bg-ca-surface-container-low",
      )}
    >
      <CatalogPartThumbnail
        family={item.family}
        imageUrl={item.imageUrl}
        partId={item.id}
        alt={item.name}
        visualVariant={isReferenceLayout ? "layout-blueprint" : "default"}
        uniformCardMedia
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 378px"
      />
      <CardHeader className="flex flex-1 flex-col space-y-1.5 border-b-0 pb-2 pt-3">
        <p className="font-label text-[0.7rem] font-medium tracking-wide text-ca-on-surface-variant">
          {FAMILY_LABELS[item.family]}
        </p>
        <CardTitle className="line-clamp-2 min-h-[2.5rem] font-headline text-base font-semibold leading-snug text-ca-on-surface">
          {item.name}
        </CardTitle>
        <div className="min-h-[1.5rem]">
          {item.family === "layout" && isReferenceLayout ? (
            <LayoutTraitChips
              metadata={layoutArchetypeMetadata(item.id)}
              limit={3}
              compact
              className="pt-0.5"
            />
          ) : item.family === "case" ? (
            <CompatibleLayoutChips
              layoutSize={item.layoutSize}
              compatibleLayoutSizes={item.compatibleLayoutSizes}
              limit={3}
              compact
              className="pt-0.5"
            />
          ) : tagLabel ? (
            <span className="ca-chip">{tagLabel}</span>
          ) : isReferenceOnlyLayout ? (
            <span className="ca-chip">참조 배열</span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex min-h-[2.75rem] flex-wrap items-center justify-between gap-2 border-t border-ca-outline-variant/25 pt-3 text-xs text-ca-on-surface-variant">
        {isReferenceOnlyLayout ? (
          <span>판매 제품 없음</span>
        ) : retailerUrl ? (
          <a
            href={retailerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              event.stopPropagation();
              void emitOutboundShopClickBestEffort({
                surface: "catalog",
                domain: item.family,
                itemId: item.id,
                href: retailerUrl,
              });
            }}
            onKeyDown={(event) => event.stopPropagation()}
            className="font-label text-ca-label-sm font-medium text-ca-on-surface-variant underline-offset-4 hover:text-ca-on-surface hover:underline"
          >
            판매처에서 가격 확인
          </a>
        ) : (
          <span>가격은 판매처에서 확인</span>
        )}
        {caseCatalogHref ? (
          <Link
            href={caseCatalogHref}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            className="font-label text-ca-label-sm font-medium text-ca-primary underline-offset-4 hover:underline"
          >
            케이스/키트 보기
          </Link>
        ) : (
          <span className="font-label text-ca-label-sm font-medium text-ca-primary">상세 보기</span>
        )}
      </CardContent>
    </Card>
  );
}

function CatalogGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={`catalog-skel-${i}`}
          className="flex min-h-[16.5rem] flex-col overflow-hidden rounded-[inherit] border border-ca-outline-variant/30 bg-ca-surface-container-lowest/40"
          aria-hidden
        >
          <div className="aspect-[4/3] w-full animate-pulse bg-ca-surface-container" style={{ aspectRatio: "4 / 3" }} />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-ca-surface-container/80" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-ca-surface-container" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-ca-surface-container/80" />
          </div>
        </div>
      ))}
    </>
  );
}

function SecondarySubtypeFilters({
  family,
  subtype,
  layoutBrowseSubtype,
  onSelect,
}: {
  family: CatalogFamily;
  subtype: string;
  layoutBrowseSubtype: LayoutBrowseSubtype;
  onSelect: (nextSubtype: string) => void;
}) {
  if (family === "layout") {
    return (
      <div className="flex flex-wrap gap-2">
        {LAYOUT_SUBTYPES.map((row) => (
          <Button
            key={row.id}
            type="button"
            variant={layoutBrowseSubtype === row.id ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-8 rounded-full font-body text-sm font-medium")}
            onClick={() => onSelect(row.id)}
          >
            {row.label}
          </Button>
        ))}
      </div>
    );
  }
  if (family === "switch") {
    return (
      <div className="flex flex-wrap gap-2">
        {SWITCH_SUBTYPES.map((row) => (
          <Button
            key={row.id || "all"}
            type="button"
            variant={subtype === row.id ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-8 rounded-full font-body text-sm font-medium")}
            onClick={() => onSelect(row.id)}
          >
            {row.label}
          </Button>
        ))}
      </div>
    );
  }
  if (family === "keycap") {
    return (
      <div className="flex flex-wrap gap-2">
        {KEYCAP_SUBTYPES.map((row) => (
          <Button
            key={row.id || "all-keycap"}
            type="button"
            variant={subtype === row.id ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-8 rounded-full font-body text-sm font-medium")}
            onClick={() => onSelect(row.id)}
          >
            {row.label}
          </Button>
        ))}
      </div>
    );
  }
  if (family === "case") {
    return (
      <div className="flex flex-wrap gap-2">
        {CASE_SUBTYPES.map((row) => (
          <Button
            key={row.id || "all-case"}
            type="button"
            variant={subtype === row.id ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-8 rounded-full font-body text-sm font-medium")}
            onClick={() => onSelect(row.id)}
          >
            {row.label}
          </Button>
        ))}
      </div>
    );
  }
  return null;
}

export function CatalogBrowseView({
  initialList = null,
  initialQueryKey = null,
}: {
  initialList?: CatalogListResponse | null;
  initialQueryKey?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const legacyKeycap =
    searchParams.get("mode") === "full" && searchParams.get("category") === "keycap";
  const family: CatalogFamily = legacyKeycap ? "keycap" : parseFamily(searchParams.get("family"));
  const subtype = searchParams.get("subtype") ?? "";
  const layoutBrowseSubtype = parseLayoutBrowseSubtype(subtype);
  const layoutSize = searchParams.get("layoutSize") ?? "";
  const searchQuery = searchParams.get("q") ?? "";
  const page = parsePage(searchParams.get("page"));
  const fromResults = searchParams.get("from") === "results";

  const queryKey = catalogListQueryKey({
    family,
    subtype: family === "layout" ? layoutBrowseSubtype : subtype,
    layoutSize: family === "case" ? layoutSize : "",
    q: searchQuery,
    page,
  });
  const hasMatchingInitial = Boolean(initialList && initialQueryKey && initialQueryKey === queryKey);

  const [searchInput, setSearchInput] = useState(searchQuery);
  const searchDebouncedRef = useRef(false);
  const skippedInitialFetchRef = useRef(hasMatchingInitial);
  const [items, setItems] = useState<CatalogPartSummary[]>(() =>
    hasMatchingInitial && initialList ? initialList.items : [],
  );
  const [total, setTotal] = useState(() => (hasMatchingInitial && initialList ? initialList.total : 0));
  const [limit, setLimit] = useState(() =>
    hasMatchingInitial && initialList ? initialList.limit : PAGE_SIZE,
  );
  const [offset, setOffset] = useState(() =>
    hasMatchingInitial && initialList ? initialList.offset : 0,
  );
  const [loading, setLoading] = useState(!hasMatchingInitial);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [partDetail, setPartDetail] = useState<CatalogPartDetail | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const catalogTopRef = useRef<HTMLDivElement>(null);

  const hasSecondaryFilters =
    family === "layout" || family === "switch" || family === "keycap" || family === "case";

  const replaceCatalogParams = useCallback(
    (patch: {
      family?: CatalogFamily;
      subtype?: string;
      layoutSize?: string | null;
      q?: string | null;
      page?: number;
      from?: string | null;
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
      if (patch.from !== undefined) {
        if (patch.from) params.set("from", patch.from);
        else params.delete("from");
      }
      router.replace(`/catalog?${params.toString()}`, { scroll: false });
      setSelectedId(null);
    },
    [router, searchParams],
  );

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (searchQuery.trim()) {
      chips.push({
        key: "q",
        label: `검색: ${searchQuery.trim()}`,
        clear: () => replaceCatalogParams({ q: null, page: 1 }),
      });
    }
    if (isSecondarySubtypeActive(family, family === "layout" ? layoutBrowseSubtype : subtype)) {
      const label = subtypeLabel(family, family === "layout" ? layoutBrowseSubtype : subtype);
      if (label) {
        chips.push({
          key: "subtype",
          label,
          clear: () =>
            replaceCatalogParams({
              subtype: family === "layout" ? "pcb" : "",
              page: 1,
            }),
        });
      }
    }
    if (family === "case" && layoutSize.trim()) {
      chips.push({
        key: "layoutSize",
        label: `${layoutSizeFilterLabel(layoutSize)} 호환`,
        clear: () => replaceCatalogParams({ layoutSize: null, page: 1 }),
      });
    }
    return chips;
  }, [family, subtype, layoutBrowseSubtype, layoutSize, searchQuery, replaceCatalogParams]);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedId(null);
  }, [family, layoutSize, subtype, layoutBrowseSubtype, searchQuery, page]);

  useEffect(() => {
    if (family !== "layout") return;
    if (subtype === "pcb" || subtype === "reference") return;
    replaceCatalogParams({ subtype: "pcb", page });
  }, [family, subtype, page, replaceCatalogParams]);

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
      setError(catalogLoadErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [family, layoutSize, subtype, layoutBrowseSubtype, searchQuery, page]);

  useEffect(() => {
    if (skippedInitialFetchRef.current) {
      skippedInitialFetchRef.current = false;
      return;
    }
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

  const clearAllSecondaryFilters = () => {
    replaceCatalogParams({
      subtype: family === "layout" ? "pcb" : "",
      layoutSize: null,
      q: null,
      page: 1,
    });
    setSearchInput("");
    setMobileFiltersOpen(false);
  };

  const onSubtypeSelect = (nextSubtype: string) => {
    replaceCatalogParams({ subtype: nextSubtype, page: 1 });
    setMobileFiltersOpen(false);
  };

  return (
    <PageShell className="max-w-ca space-y-5 px-ca-margin-mobile sm:px-ca-margin">
      <div ref={catalogTopRef} className="scroll-mt-24 space-y-3">
        {fromResults ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container/40 px-3 py-2 text-sm">
            <p className="break-keep text-ca-on-surface-variant">
              추천 결과에서 온 탐색 · 현재{" "}
              <span className="font-medium text-ca-on-surface">{FAMILY_LABELS[family]}</span>
            </p>
            <Link
              href="/results"
              className="font-medium text-ca-primary underline-offset-4 hover:underline"
            >
              추천 결과로 돌아가기
            </Link>
          </div>
        ) : null}

        <div className="space-y-2">
          <h1 className="font-headline text-2xl font-semibold tracking-tight text-ca-on-surface">
            키보드 부품 둘러보기
          </h1>
          <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant">
            제품과 부품을 직접 탐색할 수 있어요.
            <br className="hidden sm:block" /> 취향에 맞는 조합이 필요하면 추천 설문을 이용하세요.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <Link href="/recommend" className={buttonClassName({ variant: "outline", size: "sm" })}>
              추천 설문 시작
            </Link>
          </div>
          <p className="break-keep text-xs leading-relaxed text-ca-on-surface-variant/90">
            가격·재고는 스웨그키 매장 기준이며 구매 전 최종 확인해 주세요.
          </p>
        </div>

        <div className="sm:max-w-sm">
          <Input
            type="search"
            className="ca-input"
            placeholder="카탈로그에서 부품 검색…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="카탈로그에서 부품 검색"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-label text-xs font-medium text-ca-on-surface-variant">부품군</p>
        <div className="flex flex-wrap gap-2">
          {CATALOG_TABS.map((tab) => (
            <Button
              key={tab.id}
              type="button"
              variant={family === tab.id ? "primary" : "outline"}
              size="default"
              className={
                family === tab.id
                  ? "h-10 rounded-lg px-4 font-headline text-sm font-semibold sm:px-5"
                  : "h-10 rounded-lg border-ca-outline-variant/60 px-4 font-headline text-sm font-semibold text-ca-on-surface-variant hover:border-ca-on-surface/30 hover:bg-ca-surface-container/50 sm:px-5"
              }
              onClick={() => {
                replaceCatalogParams({
                  family: tab.id,
                  subtype: tab.id === "layout" ? "pcb" : "",
                  layoutSize: tab.id === "case" ? layoutSize : null,
                  ...(tab.id !== family ? { q: null } : {}),
                  page: 1,
                });
              }}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {hasSecondaryFilters ? (
        <>
          <div className="hidden space-y-2 md:block">
            <p className="font-label text-xs font-medium text-ca-on-surface-variant">세부 필터</p>
            <SecondarySubtypeFilters
              family={family}
              subtype={subtype}
              layoutBrowseSubtype={layoutBrowseSubtype}
              onSelect={onSubtypeSelect}
            />
          </div>
          <div className="md:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 w-full justify-between rounded-lg px-3"
              aria-expanded={mobileFiltersOpen}
              onClick={() => setMobileFiltersOpen(true)}
            >
              <span>
                {activeFilterChips.length > 0
                  ? `필터 ${activeFilterChips.length}개 적용`
                  : "세부 필터"}
              </span>
              <span className="text-ca-on-surface-variant">열기</span>
            </Button>
          </div>
        </>
      ) : null}

      {activeFilterChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-ca-primary/35 bg-ca-primary/10 px-3 text-xs font-medium text-ca-on-surface"
              onClick={chip.clear}
              aria-label={`${chip.label} 필터 제거`}
            >
              <span className="max-w-[12rem] truncate">{chip.label}</span>
              <span aria-hidden>×</span>
            </button>
          ))}
          <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full" onClick={clearAllSecondaryFilters}>
            전체 초기화
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ca-on-surface-variant">
          {loading ? "불러오는 중…" : `총 ${total}개`}
          {!loading && total > 0 ? ` · ${pageStart}–${pageEnd} 표시` : null}
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && !error && items.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-dashed border-ca-outline-variant/50 bg-ca-surface-container-lowest p-5">
          <p className="text-sm text-ca-on-surface-variant">
            {searchQuery.trim()
              ? `「${searchQuery.trim()}」검색 결과가 없습니다. 다른 이름·브랜드로 시도하거나 아래 키워드를 눌러 보세요.`
              : "표시할 항목이 없습니다. 필터를 바꾸거나 다른 부품 탭을 골라 보세요."}
          </p>
          {searchQuery.trim() ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  replaceCatalogParams({ q: null, page: 1 });
                }}
              >
                검색 지우기
              </Button>
              {["체리", "HMX", "Gateron", "포론", "PBT"].map((hint) => (
                <Button
                  key={hint}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchInput(hint)}
                >
                  {hint}
                </Button>
              ))}
            </div>
          ) : activeFilterChips.length > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={clearAllSecondaryFilters}>
              필터 초기화
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => replaceCatalogParams({ family: "switch", subtype: "", page: 1 })}>
              스위치 탭으로 돌아가기
            </Button>
          )}
        </div>
      ) : null}

      <section
        className="grid min-h-[32rem] items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy={loading}
      >
        {loading && items.length === 0 ? <CatalogGridSkeleton count={6} /> : null}
        {items.map((item, index) => (
          <CatalogPartCard
            key={item.id}
            item={item}
            selected={selectedId === item.id}
            onSelect={() => setSelectedId(item.id)}
            priority={index === 0 && page === 1 && !loading}
          />
        ))}
      </section>

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

      {mobileFiltersOpen && hasSecondaryFilters ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-ca-base/70 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="catalog-mobile-filters-title"
          onClick={() => setMobileFiltersOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest p-4 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p id="catalog-mobile-filters-title" className="font-headline text-base font-semibold text-ca-on-surface">
                세부 필터
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={() => setMobileFiltersOpen(false)}>
                닫기
              </Button>
            </div>
            <SecondarySubtypeFilters
              family={family}
              subtype={subtype}
              layoutBrowseSubtype={layoutBrowseSubtype}
              onSelect={onSubtypeSelect}
            />
            {activeFilterChips.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={clearAllSecondaryFilters}
              >
                필터 전체 초기화
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
