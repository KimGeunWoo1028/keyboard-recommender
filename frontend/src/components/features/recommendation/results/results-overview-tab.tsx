"use client";

import Link from "next/link";
import { useEffect, useState, type SyntheticEvent } from "react";

import { catalogHref } from "@/lib/catalog-links";
import { isReferenceOnlyLayoutArchetype } from "@/lib/layout-catalog-links";
import { pickSourceUrlKey } from "@/lib/swagkey-source-links";
import { layoutArchetypeMetadata } from "@/components/features/catalog/layout-diagram/layout-archetype-metadata";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";
import { PurchaseTrustBlock } from "@/components/features/trust/purchase-trust-block";

import { ResultsOverviewDatasheetCard } from "./results-overview-datasheet-card";
import {
  BUILD_DOMAIN_KEYS,
  BUILD_DOMAIN_LABELS,
  buildComponentDisplayText,
  buildPartSourceUrl,
  splitBuildComponentText,
} from "./results-build-utils";
import {
  formatEvidenceWhyLine,
  overviewBuildPartDescription,
  overviewDatasheetBrand,
  overviewDatasheetSpecLine,
  overviewDatasheetTraitPills,
} from "./results-text-utils";

type ApiPick = {
  domain: string;
  itemId: string;
  itemName?: string;
  sourceUrl?: string;
  imageUrl?: string;
  score?: number;
  summary?: string;
  whyTraits?: string[];
};

function resolvePickLayoutSize(
  domain: string,
  itemId: string,
  enrichedLayoutSizes: Record<string, string>,
): string | null {
  const key = pickSourceUrlKey(domain, itemId);
  const enriched = enrichedLayoutSizes[key]?.trim();
  if (enriched) return enriched;
  if (domain.toLowerCase() === "layout") {
    const size = layoutArchetypeMetadata(itemId).layout_size;
    return typeof size === "string" && size.trim() ? size.trim() : null;
  }
  return null;
}

export type ResultsOverviewTabProps = {
  submission: SurveySubmission;
  build: RecommendedBuild;
  apiPicks: ApiPick[];
  enrichedSourceUrls: Record<string, string>;
  enrichedLayoutSizes?: Record<string, string>;
  applyingRefine: boolean;
  refineError?: string | null;
  onApplyRefinement: (stepId: string, answerId: string, label: string) => void;
  isAuthenticated: boolean;
  /**
   * `parts` = product cards; `secondary` = explore blocks; `all` = legacy single block.
   */
  sections?: "parts" | "secondary" | "all";
};

export function ResultsOverviewTab({
  submission,
  build,
  apiPicks,
  enrichedSourceUrls,
  enrichedLayoutSizes = {},
  isAuthenticated,
  sections = "all",
}: ResultsOverviewTabProps) {
  const showParts = sections === "parts" || sections === "all";
  const showSecondary = sections === "secondary" || sections === "all";
  /** Desktop: keep secondary blocks open; mobile: collapsed by default (P18). */
  const [exploreOpen, setExploreOpen] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      setExploreOpen(true);
      return;
    }
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => {
      setExploreOpen(mq.matches);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  function onExploreToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    const el = event.currentTarget;
    if (typeof window.matchMedia === "function" && window.matchMedia("(min-width: 640px)").matches) {
      el.open = true;
      setExploreOpen(true);
      return;
    }
    setExploreOpen(el.open);
  }

  return (
    <>
      {showParts ? (
      <div className="space-y-4" data-testid="e2e-server-ranked">
        <p className="text-sm text-ca-on-surface-variant">
          취향 분석을 바탕으로 선정한 6가지 부품 조합입니다.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BUILD_DOMAIN_KEYS.map((key) => {
            const parsed = splitBuildComponentText(buildComponentDisplayText(build, key, apiPicks));
            const sourceUrl = buildPartSourceUrl(build, key, apiPicks, enrichedSourceUrls);
            const pick = apiPicks.find((row) => row.domain.toLowerCase() === key);
            const blurb = overviewBuildPartDescription(
              parsed.description,
              pick?.summary,
              parsed.name,
            );
            const whyLine = formatEvidenceWhyLine(pick?.summary, pick?.whyTraits, parsed.name, key);
            const layoutSize =
              key === "layout" || key === "case"
                ? pick?.itemId
                  ? resolvePickLayoutSize(key, pick.itemId, enrichedLayoutSizes)
                  : null
                : null;
            const layoutCatalogHref =
              key === "layout" && layoutSize && !isReferenceOnlyLayoutArchetype(pick?.itemId)
                ? catalogHref({ family: "case", layoutSize, from: "results" })
                : null;

            return (
              <ResultsOverviewDatasheetCard
                key={key}
                category={BUILD_DOMAIN_LABELS[key]}
                specLine={overviewDatasheetSpecLine(key, pick?.whyTraits, pick?.summary)}
                brand={overviewDatasheetBrand(parsed.name, pick?.itemId)}
                name={parsed.name}
                description={blurb}
                traits={overviewDatasheetTraitPills(pick?.whyTraits, key, whyLine)}
                sourceUrl={sourceUrl}
                domain={key}
                itemId={pick?.itemId}
                layoutSize={layoutSize}
                layoutCatalogHref={layoutCatalogHref}
              />
            );
          })}
        </div>
        <div className="rounded-xl border border-border bg-white px-4 py-3 dark:bg-ca-surface-container sm:px-5">
          <details className="group">
            <summary className="cursor-pointer list-none text-sm font-medium text-ca-on-surface marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
              <span className="underline-offset-2 group-open:underline">구매·재고 안내</span>
            </summary>
            <div className="mt-2">
              <PurchaseTrustBlock />
            </div>
          </details>
          <p className="mt-3 break-keep text-sm text-ca-on-surface-variant">
            {isAuthenticated
              ? "계정에 저장하려면 「이 결과 저장」을 누르세요. 저장한 결과는 마이페이지에서 다시 확인할 수 있습니다."
              : "「이 브라우저에 저장」은 이 브라우저에만 임시로 남습니다. 계정에 보관하려면 로그인하세요."}
          </p>
          {isAuthenticated ? (
            <Link
              href="/mypage?section=saved"
              className="mt-2 inline-block text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline"
            >
              마이페이지에서 다시 보기
            </Link>
          ) : (
            <Link
              href="/auth?mode=login"
              className="mt-2 inline-block text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline"
            >
              계정에 보관하려면 로그인
            </Link>
          )}
        </div>
      </div>
      ) : null}

      {showSecondary ? (
        <div className="mt-6 flex flex-col gap-2 rounded-xl border border-border bg-white dark:bg-ca-surface-container px-4 py-4 sm:px-5">
          <p className="font-headline text-sm font-semibold text-ca-on-surface">다른 선택지도 보고 싶나요?</p>
          <p className="break-keep text-sm text-ca-on-surface-variant">
            비교 탭에서 비슷한 부품을 확인하거나, 카탈로그·설문으로 이어갈 수 있어요.
          </p>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={catalogHref({ family: "switch", from: "results" })}
              className={buttonClassName({ variant: "outline", size: "default" })}
            >
              카탈로그에서 더 보기
            </Link>
            <Link
              href="/recommend"
              className={buttonClassName({ variant: "ghost", size: "default" })}
            >
              설문 다시 하기
            </Link>
          </div>
        </div>
      ) : null}

      {showSecondary && submission.degradedReason ? (
        <Card className="mt-8 border-amber-500/40 bg-amber-500/10 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-950 dark:text-amber-100">안정 모드로 추천했어요</CardTitle>
            <CardDescription className="text-amber-900/90 dark:text-amber-100/90">
              일시적인 연결 문제로 기본 경로 추천을 먼저 보여드렸어요. 잠시 후 다시 시도하면 더 정교한 결과를 받을 수 있습니다.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {showSecondary ? (
      <details
        className="group mt-8 rounded-xl border border-border bg-white dark:bg-ca-surface-container"
        open={exploreOpen}
        onToggle={onExploreToggle}
      >
        <summary className="cursor-pointer list-none px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden sm:cursor-default sm:pointer-events-none sm:px-6">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <h3 className="font-headline text-base font-semibold text-ca-on-surface">관련 부품 더 탐색하기</h3>
              <p className="text-sm text-ca-on-surface-variant">
                스위치·플레이트·폼·레이아웃·케이스/키트·키캡 카탈로그에서 직접 탐색해 보세요.
              </p>
            </div>
            <span className="shrink-0 pt-0.5 text-xs text-ca-on-surface-variant sm:hidden group-open:hidden">펼치기</span>
            <span className="hidden shrink-0 pt-0.5 text-xs text-ca-on-surface-variant group-open:inline sm:hidden">접기</span>
          </div>
        </summary>
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border px-4 py-4 sm:px-6">
          <Link href={catalogHref({ family: "switch", from: "results" })} className="text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline">
            스위치
          </Link>
          <Link href={catalogHref({ family: "plate", from: "results" })} className="text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline">
            플레이트
          </Link>
          <Link href={catalogHref({ family: "foam", from: "results" })} className="text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline">
            폼
          </Link>
          <Link href={catalogHref({ family: "layout", from: "results" })} className="text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline">
            레이아웃
          </Link>
          <Link href={catalogHref({ family: "case", from: "results" })} className="text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline">
            케이스/키트
          </Link>
          <Link href={catalogHref({ family: "keycap", from: "results" })} className="text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline">
            키캡
          </Link>
        </div>
      </details>
      ) : null}
    </>
  );
}
