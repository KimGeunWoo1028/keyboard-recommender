"use client";

import Link from "next/link";
import { useMemo } from "react";

import { catalogHref } from "@/lib/catalog-links";
import { isReferenceOnlyLayoutArchetype } from "@/lib/layout-catalog-links";
import { layoutSizeShortLabel } from "@/lib/layout-size";
import { pickSourceUrlKey } from "@/lib/swagkey-source-links";
import { layoutArchetypeMetadata } from "@/components/features/catalog/layout-diagram/layout-archetype-metadata";
import { CatalogPartThumbnail } from "@/components/features/catalog/catalog-part-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CatalogFamily } from "@/lib/api/catalog";
import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";

import { HelpHint } from "./help-hint";
import { DISPLAY_K } from "./results-constants";
import {
  BUILD_DOMAIN_KEYS,
  BUILD_DOMAIN_LABELS,
  buildComponentDisplayText,
  buildPartSourceUrl,
  domainDisplayLabel,
  formatScore,
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
  saveState: "idle" | "saving" | "saved" | "error";
  saveMessage: string;
  onSaveBuild: () => void;
};

export function ResultsOverviewTab({
  submission,
  build,
  apiPicks,
  enrichedSourceUrls,
  enrichedLayoutSizes = {},
  isAuthenticated,
  saveState,
  saveMessage,
  onSaveBuild,
}: ResultsOverviewTabProps) {
  const overviewAlternatives = useMemo(
    () => collectOverviewAlternatives(apiPicks, DISPLAY_K),
    [apiPicks],
  );

  return (
    <>
      <Card className="ca-glass-panel border-ca-outline-variant/40" data-testid="e2e-server-ranked">
        <CardHeader className="border-b border-ca-outline-variant/30 pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 font-headline text-base text-ca-on-surface">
            <span>추천 빌드 구성 (6축)</span>
            <HelpHint text="이번 결과에서 선택된 핵심 구성품(스위치, 플레이트, 폼, 레이아웃, 케이스/키트, 키캡) 요약입니다. 최종 조합의 뼈대를 한눈에 확인할 수 있어요." />
          </CardTitle>
          <CardDescription className="hidden text-ca-on-surface-variant sm:block">
            스위치부터 키캡까지 6개 축으로 구성된 추천 조합입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2.5 pt-3 sm:grid-cols-2 sm:gap-3 sm:pt-4 lg:grid-cols-3">
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
                className="overflow-hidden rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container/45"
              >
                <CatalogPartThumbnail
                  family={key as CatalogFamily}
                  imageUrl={pick?.imageUrl}
                  partId={pick?.itemId}
                  alt={parsed.name}
                  className="rounded-none"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-label text-ca-label-sm font-semibold text-ca-secondary">{BUILD_DOMAIN_LABELS[key]}</p>
                  {layoutSize ? (
                    <Badge className="border-ca-outline-variant/60 bg-ca-surface-container-highest/40 font-normal text-ca-on-surface-variant">
                      {layoutSizeShortLabel(layoutSize)}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 font-headline text-base font-bold text-ca-on-surface">{parsed.name}</p>
                {blurb ? (
                  <p className="mt-1 line-clamp-3 break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:line-clamp-none">
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
                      className="text-xs font-medium text-ca-primary underline-offset-2 hover:underline"
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
        <div className="flex flex-col gap-3 border-t border-ca-outline-variant/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="space-y-1.5 sm:max-w-md">
            <p className="text-xs leading-relaxed text-ca-on-surface-variant sm:text-sm">
              마음에 드는 조합이면 저장해 두세요. 마이페이지의 저장한 빌드에서 다시 확인할 수 있어요.
            </p>
            <Link
              href="/mypage?section=saved"
              className="inline-block text-xs font-medium text-ca-primary underline-offset-2 hover:underline sm:text-sm"
            >
              마이페이지에서 저장한 빌드 보기
            </Link>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
            <Button
              data-testid="e2e-save-build"
              size="sm"
              className="h-9 w-full rounded-full sm:h-8 sm:min-w-[7.5rem]"
              disabled={saveState === "saving"}
              onClick={() => void onSaveBuild()}
            >
              {saveState === "saving" ? "저장 중..." : isAuthenticated ? "이 빌드 저장" : "로컬에 저장"}
            </Button>
            {saveMessage ? (
              <p className="text-xs text-ca-on-surface-variant sm:text-right" role="status" aria-live="polite">
                {saveMessage}
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      {overviewAlternatives.length > 0 ? (
        <section className="space-y-3 [content-visibility:auto]">
          <div className="space-y-1">
            <h3 className="font-headline text-base font-semibold text-ca-on-surface">대안 구성</h3>
            <p className="text-sm text-ca-on-surface-variant">
              현재 추천과 비슷하지만 성향이 조금 다른 후보입니다. 추천 근거 탭에서 자세히 확인할 수 있어요.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {overviewAlternatives.map((alt) => {
              const blurb = overviewAlternativeDescription(alt.description, alt.summary, alt.itemName);
              return (
              <Card
                key={`${alt.domain}-${alt.itemId}`}
                className="ca-glass-panel flex h-full flex-col border-ca-outline-variant/40 bg-ca-surface-container/20"
              >
                <CardHeader className="flex-1 space-y-2 border-b-0 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge className="shrink-0 border-ca-outline-variant/60 bg-ca-surface-container-highest/40 font-normal">
                      {domainDisplayLabel(alt.domain)}
                    </Badge>
                    <span className="font-mono text-[11px] tabular-nums text-ca-on-surface-variant">
                      {formatScore(alt.score)}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-label text-ca-label-sm font-semibold text-ca-secondary">{alt.tagline}</p>
                    <CardTitle className="font-headline text-base font-bold leading-snug text-ca-on-surface">
                      {alt.itemName ?? alt.itemId}
                    </CardTitle>
                    {blurb ? (
                      <p className="line-clamp-2 break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:line-clamp-none">
                        {blurb}
                      </p>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="mt-auto border-t border-ca-outline-variant/30 pt-3">
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
        </section>
      ) : null}

      {submission.degradedReason ? (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-950 dark:text-amber-100">안정 모드로 추천했어요</CardTitle>
            <CardDescription className="text-amber-900/90 dark:text-amber-100/90">
              일시적인 연결 문제로 기본 경로 추천을 먼저 보여드렸어요. 잠시 후 다시 시도하면 더 정교한 결과를 받을 수 있습니다.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card className="ca-glass-panel border-ca-outline-variant/40 bg-ca-surface-container/20">
        <CardHeader className="border-b-0 pb-2">
          <CardTitle className="font-headline text-base text-ca-on-surface">관련 부품 더 탐색하기</CardTitle>
          <CardDescription className="text-ca-on-surface-variant">
            스위치·플레이트·폼·레이아웃·케이스/키트·키캡 카탈로그에서 직접 탐색해 보세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href={catalogHref({ family: "switch" })} className="ca-btn-ghost h-8 px-3 text-xs">
            스위치 카탈로그
          </Link>
          <Link href={catalogHref({ family: "plate" })} className="ca-btn-ghost h-8 px-3 text-xs">
            플레이트 카탈로그
          </Link>
          <Link href={catalogHref({ family: "foam" })} className="ca-btn-ghost h-8 px-3 text-xs">
            폼 카탈로그
          </Link>
          <Link href={catalogHref({ family: "layout" })} className="ca-btn-ghost h-8 px-3 text-xs">
            레이아웃 카탈로그
          </Link>
          <Link href={catalogHref({ family: "case" })} className="ca-btn-ghost h-8 px-3 text-xs">
            케이스/키트 카탈로그
          </Link>
          <Link href={catalogHref({ family: "keycap" })} className="ca-btn-ghost h-8 px-3 text-xs">
            키캡 카탈로그
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
