"use client";

import { catalogHref } from "@/lib/catalog-links";
import { isReferenceOnlyLayoutArchetype } from "@/lib/layout-catalog-links";
import { pickSourceUrlKey } from "@/lib/swagkey-source-links";
import { layoutArchetypeMetadata } from "@/components/features/catalog/layout-diagram/layout-archetype-metadata";
import type { RecommendedBuild } from "@/types/recommendation";

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
  build: RecommendedBuild;
  apiPicks: ApiPick[];
  enrichedSourceUrls: Record<string, string>;
  enrichedLayoutSizes?: Record<string, string>;
};

export function ResultsOverviewTab({
  build,
  apiPicks,
  enrichedSourceUrls,
  enrichedLayoutSizes = {},
}: ResultsOverviewTabProps) {
  return (
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
    </div>
  );
}
