"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

import { getLayoutBlueprint } from "./layout-diagram-definitions";
import type { LayoutBlueprint, LayoutConnectorDef, LayoutDiagramId, LayoutJackDef, LayoutKeyDef, LayoutKeyRole } from "./layout-diagram-types";

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

function rectCorners(rect: { x: number; y: number; width: number; height: number }) {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];
}

function parseRotateTransform(transform: string): { angleDeg: number; cx: number; cy: number } | null {
  const match = transform.match(/rotate\(([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\)/);
  if (!match) {
    return null;
  }
  return { angleDeg: Number(match[1]), cx: Number(match[2]), cy: Number(match[3]) };
}

/** SVG rotate(angle) — positive angle is clockwise. */
function svgRotatePoint(x: number, y: number, cx: number, cy: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;
  return {
    x: cx + cos * dx + sin * dy,
    y: cy - sin * dx + cos * dy,
  };
}

function parseTranslateY(transform: string): number {
  const match = transform.match(/translate\(\s*0\s+([-\d.]+)\s*\)/);
  return match ? Number(match[1]) : 0;
}

export function keyBoundsInDiagram(
  key: LayoutKeyDef,
  blockTransform?: string,
): { x: number; y: number; width: number; height: number } {
  const rect = keyRect(key);
  const rotate = blockTransform ? parseRotateTransform(blockTransform) : null;
  const translateY = blockTransform ? parseTranslateY(blockTransform) : 0;
  if (!rotate && translateY === 0) {
    return rect;
  }
  let corners = rectCorners(rect);
  if (rotate) {
    corners = corners.map((point) =>
      svgRotatePoint(point.x, point.y, rotate.cx, rotate.cy, rotate.angleDeg),
    );
  }
  if (translateY !== 0) {
    corners = corners.map((point) => ({ ...point, y: point.y + translateY }));
  }
  const xs = corners.map((point) => point.x);
  const ys = corners.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
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

function connectorPointPx(point: { x: number; y: number }) {
  return { x: point.x * PITCH, y: point.y * PITCH };
}

function jackRectPx(jack: LayoutJackDef) {
  const h = jack.h;
  return {
    x: jack.x * PITCH,
    y: jack.y * PITCH,
    width: jack.w * KEY_UNIT + Math.max(0, jack.w - 1) * KEY_GAP,
    height: h * KEY_HEIGHT + Math.max(0, h - 1) * KEY_GAP,
  };
}

function jackBoundsPx(jack: LayoutJackDef) {
  const rect = jackRectPx(jack);
  return {
    minX: rect.x,
    minY: rect.y,
    maxX: rect.x + rect.width,
    maxY: rect.y + rect.height,
  };
}

function jackCenterTopPx(jack: LayoutJackDef) {
  const rect = jackRectPx(jack);
  return {
    x: rect.x + rect.width / 2,
    y: rect.y,
  };
}

const JACK_CABLE_STUB_U = 0.55;
const JACK_CABLE_ARCH_RISE_U = 2.2;

/** 잭 상단 중앙에서 올라갔다가 가운데 둥근 아치로 연결. */
function buildJackCablePath(jacks: LayoutJackDef[]): string {
  const [leftJack, rightJack] = jacks;
  if (!leftJack || !rightJack) return "";

  const left = jackCenterTopPx(leftJack);
  const right = jackCenterTopPx(rightJack);
  const stub = JACK_CABLE_STUB_U * PITCH;
  const archRise = JACK_CABLE_ARCH_RISE_U * PITCH;
  const leftStubTop = left.y - stub;
  const rightStubTop = right.y - stub;
  const apexY = leftStubTop - archRise;
  const midX = (left.x + right.x) / 2;

  return [
    `M ${left.x} ${left.y}`,
    `L ${left.x} ${leftStubTop}`,
    `C ${left.x} ${apexY}, ${midX} ${apexY}, ${midX} ${apexY}`,
    `C ${midX} ${apexY}, ${right.x} ${apexY}, ${right.x} ${rightStubTop}`,
    `L ${right.x} ${right.y}`,
  ].join(" ");
}

function jackCableBoundsPx(jacks: LayoutJackDef[]) {
  const [leftJack, rightJack] = jacks;
  if (!leftJack || !rightJack) return null;

  const left = jackCenterTopPx(leftJack);
  const right = jackCenterTopPx(rightJack);
  const stub = JACK_CABLE_STUB_U * PITCH;
  const archRise = JACK_CABLE_ARCH_RISE_U * PITCH;
  return {
    minX: Math.min(left.x, right.x) - 2,
    maxX: Math.max(left.x, right.x) + 2,
    minY: left.y - stub - archRise - 2,
    maxY: Math.max(left.y, right.y) + 2,
  };
}

function SplitJackMarkers({ jacks }: { jacks: LayoutJackDef[] }) {
  const cablePath = jacks.length >= 2 ? buildJackCablePath(jacks) : "";

  return (
    <g aria-hidden className="pointer-events-none">
      {cablePath ? (
        <path
          d={cablePath}
          fill="none"
          className="stroke-[#64748b]"
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {jacks.map((jack, index) => {
        const rect = jackRectPx(jack);
        return (
          <rect
            key={`jack-${index}-${jack.x}-${jack.y}`}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            rx={1}
            className="fill-none stroke-[#64748b]"
            strokeWidth={1}
          />
        );
      })}
    </g>
  );
}

/** TRRS 케이블 — 양쪽 잭에서 위로 올랐다가 가운데에서 둥근 아치로 연결. */
function buildTrrsCablePath(connector: LayoutConnectorDef): string {
  const left = connectorPointPx(connector.left);
  const right = connectorPointPx(connector.right);
  const stub = (connector.stubU ?? 0.8) * PITCH;
  const archRise = (connector.archRiseU ?? 2.4) * PITCH;
  const leftStubTop = left.y - stub;
  const rightStubTop = right.y - stub;
  const apexY = leftStubTop - archRise;
  const midX = (left.x + right.x) / 2;
  return [
    `M ${left.x} ${left.y}`,
    `L ${left.x} ${leftStubTop}`,
    `C ${left.x} ${apexY}, ${midX} ${apexY}, ${midX} ${apexY}`,
    `C ${midX} ${apexY}, ${right.x} ${apexY}, ${right.x} ${rightStubTop}`,
    `L ${right.x} ${right.y}`,
  ].join(" ");
}

function connectorBoundsPx(connector: LayoutConnectorDef) {
  const left = connectorPointPx(connector.left);
  const right = connectorPointPx(connector.right);
  const stub = (connector.stubU ?? 0.8) * PITCH;
  const archRise = (connector.archRiseU ?? 2.4) * PITCH;
  const jackW = 4;
  const minX = Math.min(left.x, right.x) - jackW;
  const maxX = Math.max(left.x, right.x) + jackW;
  const minY = left.y - stub - archRise - 2;
  const maxY = Math.max(left.y, right.y) + 2;
  return { minX, minY, maxX, maxY };
}

function SplitTrrsConnector({ connector }: { connector: LayoutConnectorDef }) {
  const left = connectorPointPx(connector.left);
  const right = connectorPointPx(connector.right);
  const path = buildTrrsCablePath(connector);
  const jackClass = "fill-none stroke-[#64748b]";

  return (
    <g aria-hidden className="pointer-events-none">
      <path d={path} fill="none" className="stroke-[#475569]" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      {/* 좌측 L자 잭 */}
      <path
        d={`M ${left.x} ${left.y} L ${left.x} ${left.y - 5} L ${left.x - 4} ${left.y - 5}`}
        className={jackClass}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 우측 L자 잭 */}
      <path
        d={`M ${right.x} ${right.y} L ${right.x} ${right.y - 5} L ${right.x + 4} ${right.y - 5}`}
        className={jackClass}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function boundsForBlueprint(blueprint: LayoutBlueprint): {
  minX: number;
  minY: number;
  width: number;
  height: number;
} {
  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;
  for (const block of blueprint.blocks) {
    for (const key of block.keys) {
      const rect = keyBoundsInDiagram(key, block.transform);
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
    }
  }
  for (const connector of blueprint.connectors ?? []) {
    const bounds = connectorBoundsPx(connector);
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }
  for (const jack of blueprint.jacks ?? []) {
    const bounds = jackBoundsPx(jack);
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }
  const jackCableBounds = blueprint.jacks && blueprint.jacks.length >= 2 ? jackCableBoundsPx(blueprint.jacks) : null;
  if (jackCableBounds) {
    minX = Math.min(minX, jackCableBounds.minX);
    minY = Math.min(minY, jackCableBounds.minY);
    maxX = Math.max(maxX, jackCableBounds.maxX);
    maxY = Math.max(maxY, jackCableBounds.maxY);
  }
  const pad = 10;
  const viewMinX = minX - pad;
  const viewMinY = minY - pad;
  return {
    minX: viewMinX,
    minY: viewMinY,
    width: maxX - viewMinX + pad,
    height: maxY - viewMinY + pad,
  };
}

const FIXED_VIEWBOX: Partial<Record<LayoutDiagramId, string>> = {
  tkl: "0 0 280 115",
};

export function resolveLayoutDiagramViewBox(diagramId: LayoutDiagramId): string {
  const fixed = FIXED_VIEWBOX[diagramId];
  if (fixed) return fixed;
  const { minX, minY, width, height } = boundsForBlueprint(getLayoutBlueprint(diagramId));
  return `${Math.floor(minX)} ${Math.floor(minY)} ${Math.ceil(width)} ${Math.ceil(height)}`;
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
      {(blueprint.jacks ?? []).length > 0 ? <SplitJackMarkers jacks={blueprint.jacks ?? []} /> : null}
      {(blueprint.connectors ?? []).map((connector, index) => (
        <SplitTrrsConnector key={`connector-${index}`} connector={connector} />
      ))}
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
