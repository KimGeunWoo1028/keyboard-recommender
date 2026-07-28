"use client";

import type { LucideIcon } from "lucide-react";
import { Box, Cloud, Grid3x3, Keyboard, Layers, ToggleLeft } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import type { CatalogFamily } from "@/lib/api/catalog";
import { resolveCatalogImageUrl, shouldSkipCatalogImageOptimization } from "@/lib/api/catalog";
import { cn } from "@/lib/utils";

import { LayoutDiagram } from "./layout-diagram/layout-diagram";
import { layoutArchetypeMetadata } from "./layout-diagram/layout-archetype-metadata";
import { resolveLayoutDiagramId } from "./layout-diagram/layout-diagram-id";
import { LayoutTraitChips } from "./layout-diagram/layout-trait-chips";

const FAMILY_ICONS: Record<CatalogFamily, LucideIcon> = {
  switch: ToggleLeft,
  plate: Layers,
  foam: Cloud,
  layout: Grid3x3,
  case: Box,
  keycap: Keyboard,
};

const FAMILY_FALLBACK_LABELS: Record<CatalogFamily, string> = {
  switch: "스위치",
  plate: "플레이트",
  foam: "폼",
  layout: "레이아웃",
  case: "케이스/키트",
  keycap: "키캡",
};

type Props = {
  family: CatalogFamily;
  imageUrl?: string;
  partId?: string;
  metadata?: Record<string, unknown>;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Taller blueprint area for layout archetype cards */
  visualVariant?: "default" | "layout-blueprint";
  uniformCardMedia?: boolean;
  showTraitChips?: boolean;
};

export function CatalogPartThumbnail({
  family,
  imageUrl,
  partId,
  metadata,
  alt,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  visualVariant = "default",
  uniformCardMedia = false,
  showTraitChips = false,
}: Props) {
  const [failed, setFailed] = useState(false);
  const trimmed = resolveCatalogImageUrl(imageUrl ?? "");
  const diagramId = resolveLayoutDiagramId(partId, imageUrl);
  const showBlueprint = diagramId !== null;
  const isFullSizeBlueprint = diagramId === "full-size";
  const showImage = Boolean(trimmed) && !failed && !showBlueprint;
  // Optimize /media mirrors via next/image (resize + WebP/AVIF) when the host is
  // allowlisted; unknown remotes stay unoptimized so they still render.
  const useUnoptimized = shouldSkipCatalogImageOptimization(trimmed);
  const Icon = FAMILY_ICONS[family];
  const isLayoutBlueprint = visualVariant === "layout-blueprint" || (family === "layout" && showBlueprint);
  const mediaAspect =
    uniformCardMedia || !isLayoutBlueprint
      ? "4 / 3"
      : isFullSizeBlueprint
        ? "2 / 1"
        : "5 / 3";
  const mediaClassName = uniformCardMedia
    ? "aspect-[4/3]"
    : isLayoutBlueprint
      ? isFullSizeBlueprint
        ? "aspect-[2/1] min-h-[9.5rem]"
        : "aspect-[5/3] min-h-[9.5rem]"
      : "aspect-[4/3]";
  // Intrinsic box for CLS (CAT-01): CSS aspect + matching width/height on next/image.
  const imageWidth = 1200;
  const imageHeight = Math.round(imageWidth / (uniformCardMedia || !isLayoutBlueprint ? 4 / 3 : isFullSizeBlueprint ? 2 : 5 / 3));

  const traitMetadata =
    metadata && Object.keys(metadata).length > 0
      ? metadata
      : partId
        ? layoutArchetypeMetadata(partId)
        : {};

  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-t-[inherit] border-b border-ca-outline-variant/30",
          isLayoutBlueprint ? "bg-ca-surface-container/50" : "bg-ca-surface",
          mediaClassName,
        )}
        style={{ aspectRatio: mediaAspect }}
        data-testid="e2e-catalog-media-slot"
      >
        {showBlueprint ? (
          <div className="absolute inset-0 p-2 sm:p-3">
            <LayoutDiagram
              diagramId={diagramId}
              variant={isLayoutBlueprint ? "card" : "detail"}
              title={alt}
            />
          </div>
        ) : null}
        {showImage ? (
          <Image
            src={trimmed}
            alt={alt}
            width={imageWidth}
            height={imageHeight}
            sizes={sizes}
            /* Next `priority` preloads but does not set fetchPriority; Lighthouse needs high on the preload. */
            priority={priority}
            fetchPriority={priority ? "high" : undefined}
            unoptimized={useUnoptimized}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : null}
        {!showBlueprint && !showImage ? (
          <div
            className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-1.5 bg-ca-surface-container/40 px-4 text-center text-ca-on-surface-variant"
            role="img"
            aria-label={alt ? `${FAMILY_FALLBACK_LABELS[family]} · ${alt}` : FAMILY_FALLBACK_LABELS[family]}
          >
            <Icon className="h-8 w-8 shrink-0 stroke-[1.25] opacity-70" aria-hidden />
            <span className="font-label text-[0.65rem] font-medium uppercase tracking-wide opacity-80">
              {FAMILY_FALLBACK_LABELS[family]}
            </span>
            {alt ? (
              <span className="line-clamp-2 font-body text-xs font-medium leading-snug text-ca-on-surface/80">
                {alt}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      {showTraitChips && isLayoutBlueprint && Object.keys(traitMetadata).length > 0 ? (
        <LayoutTraitChips metadata={traitMetadata} className="border-t border-ca-outline-variant/25 px-3 py-2" />
      ) : null}
    </div>
  );
}
