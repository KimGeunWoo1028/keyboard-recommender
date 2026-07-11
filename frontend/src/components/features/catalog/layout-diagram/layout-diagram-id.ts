import type { LayoutDiagramId } from "./layout-diagram-types";

const PART_ID_TO_DIAGRAM: Record<string, LayoutDiagramId> = {
  "layout-001": "60-standard",
  "layout-002": "65-compact",
  "layout-003": "tkl",
  "layout-004": "full-size",
  "layout-005": "75-exploded",
  "layout-006": "alice",
  "layout-007": "split-60",
};

const PATH_TO_DIAGRAM: Record<string, LayoutDiagramId> = {
  "/layout-diagrams/60-standard.svg": "60-standard",
  "/layout-diagrams/65-compact.svg": "65-compact",
  "/layout-diagrams/tkl.svg": "tkl",
  "/layout-diagrams/full-size.svg": "full-size",
  "/layout-diagrams/75-exploded.svg": "75-exploded",
  "/layout-diagrams/alice.svg": "alice",
  "/layout-diagrams/split-60.svg": "split-60",
};

const LAYOUT_SIZE_TO_DIAGRAM: Record<string, LayoutDiagramId> = {
  "60": "60-standard",
  "65": "65-compact",
  "75": "75-exploded",
  "80_tkl": "tkl",
  full: "full-size",
  alice: "alice",
  split: "split-60",
};

export function resolveLayoutDiagramIdFromLayoutSize(layoutSize?: string): LayoutDiagramId | null {
  const key = (layoutSize ?? "").trim();
  if (!key) return null;
  return LAYOUT_SIZE_TO_DIAGRAM[key] ?? null;
}

export function resolveLayoutDiagramId(
  partId?: string,
  imageUrl?: string,
  layoutSize?: string,
): LayoutDiagramId | null {
  const fromSize = resolveLayoutDiagramIdFromLayoutSize(layoutSize);
  if (fromSize) return fromSize;

  const id = (partId ?? "").trim();
  if (id && PART_ID_TO_DIAGRAM[id]) return PART_ID_TO_DIAGRAM[id];

  const url = (imageUrl ?? "").trim();
  if (!url) return null;
  const path = url.startsWith("http") ? new URL(url, "http://local").pathname : url;
  return PATH_TO_DIAGRAM[path] ?? null;
}

export function isLayoutDiagramImageUrl(imageUrl?: string): boolean {
  return resolveLayoutDiagramId(undefined, imageUrl) !== null;
}

export function layoutArchetypePartId(diagramId: LayoutDiagramId): string {
  const entry = Object.entries(PART_ID_TO_DIAGRAM).find(([, value]) => value === diagramId);
  return entry?.[0] ?? "";
}
