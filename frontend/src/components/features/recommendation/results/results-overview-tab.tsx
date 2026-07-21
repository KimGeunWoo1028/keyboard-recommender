"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type SyntheticEvent } from "react";

import { catalogHref } from "@/lib/catalog-links";
import { isReferenceOnlyLayoutArchetype } from "@/lib/layout-catalog-links";
import { layoutSizeShortLabel } from "@/lib/layout-size";
import { pickSourceUrlKey } from "@/lib/swagkey-source-links";
import { layoutArchetypeMetadata } from "@/components/features/catalog/layout-diagram/layout-archetype-metadata";
import { CatalogPartThumbnail } from "@/components/features/catalog/catalog-part-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CatalogFamily } from "@/lib/api/catalog";
import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";
import { PurchaseTrustBlock } from "@/components/features/trust/purchase-trust-block";

import { HelpHint } from "./help-hint";
import { DISPLAY_K } from "./results-constants";
import {
  BUILD_DOMAIN_KEYS,
  BUILD_DOMAIN_LABELS,
  buildComponentDisplayText,
  buildPartSourceUrl,
  domainDisplayLabel,
  formatScoreBand,
  pickRowSourceUrl,
  splitBuildComponentText,
} from "./results-build-utils";
import { SwagkeyProductLink } from "./swagkey-product-link";
import {
  alternativeTagline,
  overviewAlternativeDescription,
  overviewBuildPartDescription,
} from "./results-text-utils";

type ApiAlternative = {
  itemId: string;
  itemName?: string;
  score: number;
  description?: string;
  summary: string;
  tradeOff?: string;
  sourceUrl?: string;
};

type ApiPick = {
  domain: string;
  itemId: string;
  itemName?: string;
  sourceUrl?: string;
  imageUrl?: string;
  score?: number;
  summary?: string;
  alternatives?: ApiAlternative[];
};

type OverviewAlternative = ApiAlternative & {
  domain: string;
  tagline: string;
};

function collectOverviewAlternatives(apiPicks: ApiPick[], limit: number): OverviewAlternative[] {
  const seen = new Set<string>();
  const rows: OverviewAlternative[] = [];

  const pushFromPick = (pick: ApiPick) => {
    for (const [altIdx, alt] of (pick.alternatives ?? []).entries()) {
      const key = `${pick.domain}:${alt.itemId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        ...alt,
        domain: pick.domain,
        tagline: alternativeTagline(altIdx),
      });
      if (rows.length >= limit) return;
    }
  };

  const switchPick = apiPicks.find((pick) => pick.domain.toLowerCase() === "switch");
  if (switchPick) pushFromPick(switchPick);
  if (rows.length >= limit) return rows;

  for (const pick of apiPicks) {
    pushFromPick(pick);
    if (rows.length >= limit) break;
  }

  return rows;
}

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
  /** False while AuthHeaderProvider is still resolving /auth/me. */
  authReady?: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
  onSaveBuild: () => void;
};

export function ResultsOverviewTab({
  submission,
  build,
  apiPicks,
  enrichedSourceUrls,
  enrichedLayoutSizes = {},
  isAuthenticated,
  authReady = true,
  saveState,
  onSaveBuild,
}: ResultsOverviewTabProps) {
  const overviewAlternatives = useMemo(
    () => collectOverviewAlternatives(apiPicks, DISPLAY_K),
    [apiPicks],
  );
  /** Desktop: keep secondary blocks open; mobile: collapsed by default (P18). */
  const [altsOpen, setAltsOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      setAltsOpen(true);
      setExploreOpen(true);
      return;
    }
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => {
      const desktop = mq.matches;
      setAltsOpen(desktop);
      setExploreOpen(desktop);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  function onAltsToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    const el = event.currentTarget;
    if (typeof window.matchMedia === "function" && window.matchMedia("(min-width: 640px)").matches) {
      el.open = true;
      setAltsOpen(true);
      return;
    }
    setAltsOpen(el.open);
  }

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
      <Card className="overflow-hidden rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest shadow-none" data-testid="e2e-server-ranked">
        <CardHeader className="border-b border-ca-outline-variant/35 pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 font-headline text-base font-semibold text-ca-on-surface">
            <span>추천 빌드 구성</span>
            <HelpHint text="이번 결과에서 선택된 핵심 구성품(스위치, 플레이트, 폼, 레이아웃, 케이스/키트, 키캡) 요약입니다. 최종 조합의 뼈대를 한눈에 확인할 수 있어요." />
          </CardTitle>
          <CardDescription className="hidden text-ca-on-surface-variant sm:block">
            스위치부터 키캡까지 여섯 축으로 구성된 조합입니다.
          </CardDescription>
          <div className="mt-2">
            <PurchaseTrustBlock />
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {BUILD_DOMAIN_KEYS.map((key) => {
            const parsed = splitBuildComponentText(buildComponentDisplayText(build, key, apiPicks));
            const sourceUrl = buildPartSourceUrl(build, key, apiPicks, enrichedSourceUrls);
            const pick = apiPicks.find((row) => row.domain.toLowerCase() === key);
            const blurb = overviewBuildPartDescription(
              parsed.description,
              pick?.summary,
              parsed.name,
            );
            const layoutSize =
              key === "layout" || key === "case"
                ? pick?.itemId
                  ? resolvePickLayoutSize(key, pick.itemId, enrichedLayoutSizes)
                  : null
                : null;
            return (
              <div
                key={key}
                className="overflow-hidden rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container-lowest"
              >
                <CatalogPartThumbnail
                  family={key as CatalogFamily}
                  imageUrl={pick?.imageUrl}
                  partId={pick?.itemId}
                  alt={parsed.name}
                  className="rounded-none"
                  uniformCardMedia
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-ca-on-surface-variant">{BUILD_DOMAIN_LABELS[key]}</p>
                  {layoutSize ? (
                    <Badge className="border-ca-outline-variant/50 bg-transparent font-normal text-ca-on-surface-variant">
                      {layoutSizeShortLabel(layoutSize)}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 font-headline text-base font-semibold text-ca-on-surface">{parsed.name}</p>
                {blurb ? (
                  <p className="mt-1 line-clamp-2 break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:line-clamp-none">
                    {blurb}
                  </p>
                ) : null}
                <p className="mt-2">
                  <SwagkeyProductLink href={sourceUrl} domain={key} itemId={pick?.itemId} />
                </p>
                {key === "layout" && layoutSize && !isReferenceOnlyLayoutArchetype(pick?.itemId) ? (
                  <p className="mt-2">
                    <Link
                      href={catalogHref({ family: "case", layoutSize })}
                      className="text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline"
                    >
                      {layoutSizeShortLabel(layoutSize)} 케이스/키트 보기
                    </Link>
                  </p>
                ) : null}
                </div>
              </div>
            );
          })}
        </CardContent>
        <div className="flex flex-col gap-3 border-t border-ca-outline-variant/35 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="space-y-1.5 sm:max-w-md">
            <p className="text-sm leading-relaxed text-ca-on-surface-variant">
              {isAuthenticated
                ? "계정에 저장하면 마이페이지의 저장한 빌드에서 다른 기기에서도 다시 볼 수 있어요. 설문 결과 화면 자체는 이 브라우저에 잠시 보관됩니다."
                : "로그인 없이 「로컬에 저장」하면 이 브라우저에만 남습니다. 다른 기기에서도 보려면 로그인 후 「이 빌드 저장」을 사용하세요."}
            </p>
            <Link
              href="/mypage?section=saved"
              className="inline-block text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline"
            >
              마이페이지에서 저장한 빌드 보기
            </Link>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
            <Button
              data-testid="e2e-save-build"
              variant="outline"
              size="default"
              className="w-full sm:min-w-[8.5rem] sm:w-auto"
              disabled={!authReady || saveState === "saving"}
              onClick={() => void onSaveBuild()}
            >
              {!authReady
                ? "로그인 확인 중..."
                : saveState === "saving"
                  ? "저장 중..."
                  : isAuthenticated
                    ? "이 빌드 저장"
                    : "로컬에 저장"}
            </Button>
          </div>
        </div>
      </Card>

      {overviewAlternatives.length > 0 ? (
        <>
          <div className="mt-6 flex flex-col gap-2 rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="space-y-1">
              <p className="font-headline text-sm font-semibold text-ca-on-surface">비교가 필요하신가요?</p>
              <p className="break-keep text-sm text-ca-on-surface-variant">
                전용 비교 화면 대신, 추천과 비슷한 다른 부품 후보를 아래에서 나란히 볼 수 있어요.
              </p>
            </div>
            <a
              href="#compare-alternatives"
              className={buttonClassName({ variant: "outline", size: "default" })}
              onClick={() => setAltsOpen(true)}
            >
              다른 부품과 비교하기
            </a>
          </div>
        <details
          id="compare-alternatives"
          className="group mt-4 scroll-mt-24 [content-visibility:auto]"
          open={altsOpen}
          onToggle={onAltsToggle}
        >
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden sm:pointer-events-none sm:cursor-default">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-headline text-base font-semibold text-ca-on-surface">다른 부품과 비교</h3>
                <span className="text-xs text-ca-on-surface-variant sm:hidden group-open:hidden">펼치기</span>
                <span className="hidden text-xs text-ca-on-surface-variant group-open:inline sm:hidden">접기</span>
              </div>
              <p className="text-sm text-ca-on-surface-variant">
                지금 추천과 비슷한 대안입니다. 성향 차이(비슷함/조금 다름)를 보고 고른 뒤, 추천 근거 탭에서 자세히 비교할 수
                있어요.
              </p>
            </div>
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {overviewAlternatives.map((alt) => {
              const blurb = overviewAlternativeDescription(alt.description, alt.summary, alt.itemName);
              return (
              <Card
                key={`${alt.domain}-${alt.itemId}`}
                className="flex h-full flex-col rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest shadow-none"
              >
                <CardHeader className="flex-1 space-y-2 border-b-0 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge className="shrink-0 border-ca-outline-variant/50 bg-transparent font-normal">
                      {domainDisplayLabel(alt.domain)}
                    </Badge>
                    <span className="text-xs font-medium text-ca-on-surface-variant">
                      {formatScoreBand(alt.score)}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm text-ca-on-surface-variant">{alt.tagline}</p>
                    <CardTitle className="font-headline text-base font-semibold leading-snug text-ca-on-surface">
                      {alt.itemName ?? alt.itemId}
                    </CardTitle>
                    {blurb ? (
                      <p className="line-clamp-2 break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:line-clamp-none">
                        {blurb}
                      </p>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="mt-auto border-t border-ca-outline-variant/35 pt-3">
                  <SwagkeyProductLink
                    href={pickRowSourceUrl(
                      { domain: alt.domain, itemId: alt.itemId, sourceUrl: alt.sourceUrl },
                      build,
                      apiPicks,
                      enrichedSourceUrls,
                    )}
                    domain={alt.domain}
                    itemId={alt.itemId}
                  />
                </CardContent>
              </Card>
            );
            })}
          </div>
        </details>
        </>
      ) : null}

      {submission.degradedReason ? (
        <Card className="mt-8 border-amber-500/40 bg-amber-500/10 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-950 dark:text-amber-100">안정 모드로 추천했어요</CardTitle>
            <CardDescription className="text-amber-900/90 dark:text-amber-100/90">
              일시적인 연결 문제로 기본 경로 추천을 먼저 보여드렸어요. 잠시 후 다시 시도하면 더 정교한 결과를 받을 수 있습니다.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <details
        className="group mt-8 rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest"
        open={exploreOpen}
        onToggle={onExploreToggle}
      >
        <summary className="cursor-pointer list-none px-4 py-4 [&::-webkit-details-marker]:hidden sm:cursor-default sm:pointer-events-none sm:px-6">
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
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-ca-outline-variant/35 px-4 py-4 sm:px-6">
          <Link href={catalogHref({ family: "switch" })} className="text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline">
            스위치
          </Link>
          <Link href={catalogHref({ family: "plate" })} className="text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline">
            플레이트
          </Link>
          <Link href={catalogHref({ family: "foam" })} className="text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline">
            폼
          </Link>
          <Link href={catalogHref({ family: "layout" })} className="text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline">
            레이아웃
          </Link>
          <Link href={catalogHref({ family: "case" })} className="text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline">
            케이스/키트
          </Link>
          <Link href={catalogHref({ family: "keycap" })} className="text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline">
            키캡
          </Link>
        </div>
      </details>
    </>
  );
}
