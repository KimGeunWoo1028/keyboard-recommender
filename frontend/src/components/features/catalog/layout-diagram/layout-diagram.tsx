"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

import { getLayoutBlueprint } from "./layout-diagram-definitions";
import type { LayoutBlueprint, LayoutDiagramId, LayoutKeyDef, LayoutKeyRole } from "./layout-diagram-types";

const KEY_UNIT = 11;
const KEY_GAP = 4;
const KEY_HEIGHT = 11;
const PITCH = KEY_UNIT + KEY_GAP;

type Props = {
  diagramId: LayoutDiagramId;
  className?: string;
  variant?: "card" | "detail";
  title?: string;
};

function keyRect(key: LayoutKeyDef): { x: number; y: number; width: number; height: number } {
  const h = key.h ?? 1;
  return {
    x: key.x * PITCH,
    y: key.y * PITCH,
    width: key.w * KEY_UNIT + (key.w - 1) * KEY_GAP,
    height: h * KEY_HEIGHT + (h - 1) * KEY_GAP,
  };
}

function isHighlightedKey(role: LayoutKeyRole | undefined): boolean {
  return role === "accent" || role === "space" || role === "enter" || role === "arrow";
}

function keyStyle(role: LayoutKeyRole | undefined): { className: string; strokeWidth: number } {
  if (isHighlightedKey(role)) {
    return { className: "fill-ca-primary/22 stroke-ca-primary/80", strokeWidth: 1 };
  }
  return { className: "fill-none stroke-[#94a3b8]/90", strokeWidth: 1 };
}

function boundsForBlueprint(blueprint: LayoutBlueprint): { width: number; height: number } {
  let maxX = 0;
  let maxY = 0;
  for (const block of blueprint.blocks) {
    for (const key of block.keys) {
      const rect = keyRect(key);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
    }
  }
  const pad = 10;
  return { width: maxX + pad, height: maxY + pad };
}

const FIXED_VIEWBOX: Partial<Record<LayoutDiagramId, string>> = {
  tkl: "0 0 280 115",
  alice: "0 0 260 100",
  "split-60": "0 0 260 72",
};

export function resolveLayoutDiagramViewBox(diagramId: LayoutDiagramId): string {
  const fixed = FIXED_VIEWBOX[diagramId];
  if (fixed) return fixed;
  const { width, height } = boundsForBlueprint(getLayoutBlueprint(diagramId));
  return `0 0 ${Math.ceil(width)} ${Math.ceil(height)}`;
}

export function LayoutDiagram({ diagramId, className, variant = "card", title }: Props) {
  const blueprint = getLayoutBlueprint(diagramId);
  const viewBox = useMemo(() => resolveLayoutDiagramViewBox(diagramId), [diagramId]);

  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-label={title ?? `${diagramId} keyboard layout diagram`}
      className={cn("h-full w-full", className)}
      preserveAspectRatio="xMidYMid meet"
    >
      {blueprint.blocks.map((block, blockIndex) => (
        <g key={blockIndex} transform={block.transform}>
          {block.keys.map((key, keyIndex) => {
            const rect = keyRect(key);
            const style = keyStyle(key.role);
            return (
              <rect
                key={`${blockIndex}-${keyIndex}-${key.x}-${key.y}-${key.w}`}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                rx={2}
                className={style.className}
                strokeWidth={style.strokeWidth}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}

export function layoutDiagramCallouts(diagramId: LayoutDiagramId): string[] {
  return getLayoutBlueprint(diagramId).callouts;
}
