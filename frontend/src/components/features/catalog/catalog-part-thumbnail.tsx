"use client";

import type { LucideIcon } from "lucide-react";
import { Box, Cloud, Grid3x3, Keyboard, Layers, ToggleLeft } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import type { CatalogFamily } from "@/lib/api/catalog";
import { resolveCatalogImageUrl } from "@/lib/api/catalog";
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
  showTraitChips = false,
}: Props) {
  const [failed, setFailed] = useState(false);
  const trimmed = resolveCatalogImageUrl(imageUrl ?? "");
  const diagramId = resolveLayoutDiagramId(partId, imageUrl);
  const showBlueprint = diagramId !== null;
  const isFullSizeBlueprint = diagramId === "full-size";
  const showImage = Boolean(trimmed) && !failed && !showBlueprint;
  // Local mirrors are served from the API host (often Railway). next/image's
  // optimizer only allowlists localhost + cdn.imweb.me — skip optimization for
  // all /media/swagkey-images/ URLs so absolute API origins still render.
  const useUnoptimized = trimmed.includes("/media/swagkey-images/");
  const Icon = FAMILY_ICONS[family];
  const isLayoutBlueprint = visualVariant === "layout-blueprint" || (family === "layout" && showBlueprint);
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
          "relative w-full overflow-hidden rounded-t-[inherit] bg-ca-surface-container/50",
          isLayoutBlueprint
            ? isFullSizeBlueprint
              ? "aspect-[2/1] min-h-[9.5rem]"
              : "aspect-[5/3] min-h-[9.5rem]"
            : "aspect-[4/3]",
        )}
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
            fill
            sizes={sizes}
            priority={priority}
            unoptimized={useUnoptimized}
            className="object-contain p-2"
            onError={() => setFailed(true)}
          />
        ) : null}
        {!showBlueprint && !showImage ? (
          <div
            className="flex h-full w-full items-center justify-center text-ca-on-surface-variant/60"
            aria-hidden={!alt}
          >
            <Icon className="h-10 w-10 stroke-[1.25]" />
          </div>
        ) : null}
      </div>
      {showTraitChips && isLayoutBlueprint && Object.keys(traitMetadata).length > 0 ? (
        <LayoutTraitChips metadata={traitMetadata} className="border-t border-ca-outline-variant/25 px-3 py-2" />
      ) : null}
    </div>
  );
}
