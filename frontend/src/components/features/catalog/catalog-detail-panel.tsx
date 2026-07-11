"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CompatibleLayoutChips } from "@/components/features/catalog/compatible-layout-chips";
import { CatalogPartThumbnail } from "@/components/features/catalog/catalog-part-thumbnail";
import { LayoutDiagram, LayoutDiagramPanel, resolveLayoutDiagramId } from "@/components/features/catalog/layout-diagram";
import { layoutArchetypeMetadata } from "@/components/features/catalog/layout-diagram/layout-archetype-metadata";
import type { CatalogFamily, CatalogPartDetail } from "@/lib/api/catalog";
import { catalogHref } from "@/lib/catalog-links";
import { layoutSizeFilterLabel, resolveLayoutSizeFromMetadata } from "@/lib/layout-size";
import { swagkeyProductLinkLabel } from "@/lib/layout-catalog-links";
import { normalizeSwagkeyProductUrl } from "@/lib/swagkey-source-links";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  open: boolean;
  loading: boolean;
  error: string | null;
  family?: CatalogFamily;
  partDetail?: CatalogPartDetail | null;
  onClose: () => void;
};

const FAMILY_LABELS: Record<CatalogFamily, string> = {
  switch: "스위치",
  plate: "플레이트",
  foam: "폼",
  layout: "레이아웃",
  case: "케이스/키트",
  keycap: "키캡",
};

const METADATA_LABELS: Record<string, string> = {
  material: "재질",
  spring_weight_g: "스프링 (g)",
  factory_lube: "공장 윤활",
  stem_material: "스템 재질",
  housing_material: "하우징 재질",
  compatible_layout_sizes: "호환 레이아웃",
  compatible_standards: "호환 표준",
  mounting_bias: "마운팅 성향",
  mounting_compatibility: "마운팅 호환",
  layout_size: "레이아웃 크기",
  typing_density: "타이핑 밀도",
  has_arrow_cluster: "방향키 클러스터",
  has_function_row: "펑션 행",
  is_exploded: "익스플로디드",
  blocker_style: "블로커 스타일",
  supports_blockers: "블로커 지원",
  ansi_iso_support: "ANSI/ISO",
  supported_mounting_styles: "지원 마운팅",
  kit_type: "키트 유형",
  layout_size_mm: "레이아웃 (mm)",
  mounting_style: "마운팅",
  includes_switches: "스위치 포함",
  includes_keycaps: "키캡 포함",
  profile: "프로필",
  manufacturing: "각인 방식",
  kit_scope: "키트 범위",
  colorway_mood: "컬러웨이",
};

function formatMetadataValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "boolean") return value ? "예" : "아니오";
  if (value === null || value === undefined) return "";
  return String(value);
}

function KeyValueGrid({ entries }: { entries: [string, string][] }) {
  if (entries.length === 0) return null;
  return (
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
      {entries.map(([key, value], index) => (
        <div
          key={`${key}-${index}`}
          className="rounded-md border border-ca-outline-variant/40 bg-ca-surface-container/40 px-3 py-2"
        >
          <dt className="font-label text-ca-label-sm font-medium text-ca-secondary">{key}</dt>
          <dd className="mt-1 text-ca-on-surface">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SwagkeyLink({ href, family, itemId }: { href?: string; family?: CatalogFamily; itemId?: string }) {
  const url = normalizeSwagkeyProductUrl(href);
  if (!url) return <p className="text-sm text-ca-on-surface-variant">스웨그키 링크 없음</p>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-9 items-center rounded-full border border-ca-primary/40 bg-ca-primary/10 px-3 font-label text-ca-label-sm font-medium text-ca-primary underline-offset-4 hover:bg-ca-primary/20 hover:underline"
    >
      {swagkeyProductLinkLabel(family, itemId)}
    </a>
  );
}

export function CatalogDetailPanel({ open, loading, error, family, partDetail, onClose }: Props) {
  if (!open) return null;

  const title = partDetail?.name;
  const description = partDetail?.description;

  const traitEntries = partDetail
    ? Object.entries(partDetail.traits)
        .filter(([, v]) => Number.isFinite(v))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, v.toFixed(1)] as [string, string])
    : [];

  const metadataEntries = partDetail
    ? Object.entries(partDetail.metadata)
        .map(([k, v]) => {
          const formatted = formatMetadataValue(v);
          if (!formatted) return null;
          return [METADATA_LABELS[k] ?? k, formatted] as [string, string];
        })
        .filter((row): row is [string, string] => row !== null)
    : [];

  const layoutSizeForLink = partDetail
    ? resolveLayoutSizeFromMetadata(
        family === "layout"
          ? { ...layoutArchetypeMetadata(partDetail.id), ...partDetail.metadata }
          : partDetail.metadata,
      )
    : null;
  const caseCatalogHref = layoutSizeForLink
    ? catalogHref({ family: "case", layoutSize: layoutSizeForLink })
    : catalogHref({ family: "case" });
  const caseLayoutSize = partDetail && family === "case" ? resolveLayoutSizeFromMetadata(partDetail.metadata) : null;
  const caseDiagramId =
    caseLayoutSize && partDetail ? resolveLayoutDiagramId(undefined, undefined, caseLayoutSize) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ca-base/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <Card className={cn("ca-glass-elevated max-h-[90vh] w-full overflow-y-auto border-ca-outline-variant/40 sm:max-w-2xl")}>
        <CardHeader className="sticky top-0 z-10 border-b border-ca-outline-variant/40 bg-ca-surface-container/95 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="font-headline text-lg leading-snug text-ca-on-surface">
                {loading ? "불러오는 중…" : title || "상세 정보"}
              </CardTitle>
              {description ? (
                <CardDescription className="text-ca-on-surface-variant">{description}</CardDescription>
              ) : null}
              {family ? (
                <p className="font-label text-ca-label-sm font-medium text-ca-on-surface-variant">
                  {FAMILY_LABELS[family]}
                  {partDetail?.referenceLayout ? (
                    <span className="ml-2 rounded-full border border-ca-outline-variant/50 px-2 py-0.5 text-ca-on-surface-variant">
                      참조 배열
                    </span>
                  ) : null}
                  {family === "layout" && partDetail && !partDetail.referenceLayout ? (
                    <span className="ml-2 rounded-full border border-ca-outline-variant/50 px-2 py-0.5 text-ca-on-surface-variant">
                      기판 상품
                    </span>
                  ) : null}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 whitespace-nowrap rounded-full"
              onClick={onClose}
            >
              닫기
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {loading ? <p className="text-sm text-ca-on-surface-variant">상세 정보를 불러오는 중입니다.</p> : null}

          {!loading && !error && partDetail ? (
            <>
              {family === "layout" && resolveLayoutDiagramId(partDetail.id, partDetail.imageUrl) ? (
                <LayoutDiagramPanel
                  partId={partDetail.id}
                  imageUrl={partDetail.imageUrl}
                  title={partDetail.name}
                  metadata={partDetail.metadata}
                  variant="detail"
                  className="overflow-hidden rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container/40 p-3"
                />
              ) : family === "case" && caseDiagramId ? (
                <div className="space-y-2 overflow-hidden rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container/40 p-3">
                  <p className="font-label text-ca-label-sm font-medium text-ca-secondary">호환 배열 참고</p>
                  <LayoutDiagram diagramId={caseDiagramId} variant="card" title={partDetail.name} />
                  <CompatibleLayoutChips
                    layoutSize={typeof partDetail.metadata.layout_size === "string" ? partDetail.metadata.layout_size : null}
                    compatibleLayoutSizes={
                      Array.isArray(partDetail.metadata.compatible_layout_sizes)
                        ? partDetail.metadata.compatible_layout_sizes.map(String)
                        : caseLayoutSize
                          ? [caseLayoutSize]
                          : []
                    }
                    limit={6}
                  />
                </div>
              ) : (
                <CatalogPartThumbnail
                  family={family ?? partDetail.family}
                  imageUrl={partDetail.imageUrl}
                  partId={partDetail.id}
                  alt={partDetail.name}
                  className="rounded-lg"
                  sizes="(max-width: 640px) 100vw, 672px"
                  showTraitChips
                />
              )}
              <div>
                <p className="mb-2 font-label text-ca-label-sm font-medium text-ca-secondary">Traits</p>
                <KeyValueGrid entries={traitEntries} />
              </div>
              {metadataEntries.length > 0 && !(family === "layout" && resolveLayoutDiagramId(partDetail.id, partDetail.imageUrl)) ? (
                <div>
                  <p className="mb-2 font-label text-ca-label-sm font-medium text-ca-secondary">Metadata</p>
                  <KeyValueGrid entries={metadataEntries} />
                </div>
              ) : null}
              {family === "layout" ? (
                <div className="space-y-2 text-sm text-ca-on-surface-variant">
                  <p>
                    레이아웃은 배열 참고 정보입니다. 이 크기에 맞는 실제 키트·상품은 케이스/키트 탭에서 확인하세요.
                  </p>
                  <Link
                    href={caseCatalogHref}
                    onClick={onClose}
                    className="inline-flex h-9 items-center rounded-full border border-ca-primary/40 bg-ca-primary/10 px-3 font-label text-ca-label-sm font-medium text-ca-primary underline-offset-4 hover:bg-ca-primary/20 hover:underline"
                  >
                    {layoutSizeForLink
                      ? `${layoutSizeFilterLabel(layoutSizeForLink)} 케이스/키트 보기`
                      : "케이스/키트 탭으로 이동"}
                  </Link>
                </div>
              ) : (
                <SwagkeyLink href={partDetail.sourceUrl} family={family} itemId={partDetail.id} />
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
