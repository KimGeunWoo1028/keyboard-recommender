"use client";

import { LayoutDiagram, layoutDiagramCallouts } from "./layout-diagram";
import { resolveLayoutDiagramId } from "./layout-diagram-id";
import { LayoutTraitChips } from "./layout-trait-chips";

type LayoutDiagramPanelProps = {
  partId?: string;
  imageUrl?: string;
  layoutSize?: string;
  title: string;
  metadata?: Record<string, unknown>;
  variant?: "card" | "detail";
  className?: string;
};

export function LayoutDiagramPanel({
  partId,
  imageUrl,
  layoutSize,
  title,
  metadata,
  variant = "card",
  className,
}: LayoutDiagramPanelProps) {
  const diagramId = resolveLayoutDiagramId(partId, imageUrl, layoutSize);
  if (!diagramId) return null;

  const callouts = variant === "detail" ? layoutDiagramCallouts(diagramId) : [];

  return (
    <div className={className}>
      <LayoutDiagram diagramId={diagramId} variant={variant} title={title} />
      {variant === "detail" && callouts.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-sm text-ca-on-surface-variant">
          {callouts.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ca-primary/80" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {metadata && Object.keys(metadata).length > 0 ? (
        <LayoutTraitChips metadata={metadata} className={variant === "detail" ? "mt-3" : "mt-2 px-3"} />
      ) : null}
    </div>
  );
}
