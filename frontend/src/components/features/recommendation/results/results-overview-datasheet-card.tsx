"use client";

import Link from "next/link";

import { CatalogPartThumbnail } from "@/components/features/catalog/catalog-part-thumbnail";
import type { CatalogFamily } from "@/lib/api/catalog";
import { layoutSizeShortLabel } from "@/lib/layout-size";
import { cn } from "@/lib/utils";

import { BUILD_DOMAIN_KEYS, type BuildDomainKey } from "./results-build-utils";
import { SwagkeyProductLink } from "./swagkey-product-link";

const CATALOG_FAMILIES = new Set<string>(BUILD_DOMAIN_KEYS);

function asCatalogFamily(domain?: string): CatalogFamily | null {
  const key = domain?.toLowerCase();
  if (!key || !CATALOG_FAMILIES.has(key)) return null;
  return key as BuildDomainKey;
}

export type ResultsOverviewDatasheetCardProps = {
  category: string;
  specLine: string;
  brand: string;
  name: string;
  description: string;
  traits: string[];
  sourceUrl?: string;
  domain?: string;
  itemId?: string;
  imageUrl?: string;
  layoutSize?: string | null;
  layoutCatalogHref?: string | null;
  className?: string;
};

/** Manus-style datasheet card for results overview, with catalog part thumbnail. */
export function ResultsOverviewDatasheetCard({
  category,
  specLine,
  brand,
  name,
  description,
  traits,
  sourceUrl,
  domain,
  itemId,
  imageUrl,
  layoutSize,
  layoutCatalogHref,
  className,
}: ResultsOverviewDatasheetCardProps) {
  const family = asCatalogFamily(domain);

  return (
    <article
      className={cn(
        "card-lift flex h-full flex-col overflow-hidden rounded-xl border-2 border-[rgb(220_220_238)] bg-white transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 dark:border-border dark:bg-ca-surface-container",
        className,
      )}
    >
      {family ? (
        <CatalogPartThumbnail
          family={family}
          imageUrl={imageUrl}
          partId={itemId}
          alt={name}
          uniformCardMedia
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      ) : null}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            {specLine ? (
              <p className="text-[10px] font-bold uppercase tracking-widest text-[rgb(130_130_150)] dark:text-ca-on-surface-variant">
                {specLine}
              </p>
            ) : null}
            {brand ? (
              <p className="mt-0.5 truncate text-xs font-semibold text-primary">{brand}</p>
            ) : null}
          </div>
          <span className="shrink-0 rounded-full border border-[rgb(220_220_238)] bg-[rgb(248_248_252)] px-2 py-0.5 text-xs font-bold text-[rgb(80_80_100)] dark:border-border dark:bg-ca-surface-container-low">
            {category}
          </span>
        </div>

        <h3 className="font-headline text-base font-extrabold leading-snug text-ca-on-surface">{name}</h3>

        {layoutSize ? (
          <p className="mt-1 text-xs font-medium text-ca-on-surface-variant">{layoutSizeShortLabel(layoutSize)}</p>
        ) : null}

        {description ? (
          <p className="mt-1 line-clamp-3 break-keep text-xs leading-relaxed text-ca-on-surface-variant">
            {description}
          </p>
        ) : null}

        {traits.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {traits.map((trait) => (
              <span
                key={trait}
                className="rounded-full border border-primary/15 bg-[rgb(238_235_255)] px-2.5 py-0.5 text-[11px] font-semibold text-primary dark:bg-primary/10"
              >
                {trait}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto space-y-2 pt-3">
          {sourceUrl && domain ? (
            <SwagkeyProductLink href={sourceUrl} domain={domain} itemId={itemId} />
          ) : null}
          {layoutCatalogHref ? (
            <Link
              href={layoutCatalogHref}
              className="inline-block text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline"
            >
              {layoutSize ? `${layoutSizeShortLabel(layoutSize)} 케이스/키트 보기` : "케이스/키트 보기"}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
