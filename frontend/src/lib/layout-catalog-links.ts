/** Conceptual layout rows (not kit-named); links point at representative Swagkey kits. */
export const ABSTRACT_LAYOUT_IDS = new Set([
  "layout-001",
  "layout-002",
  "layout-003",
  "layout-004",
  "layout-005",
  "layout-006",
  "layout-007",
]);

export function isAbstractLayoutId(itemId?: string): boolean {
  return Boolean(itemId && ABSTRACT_LAYOUT_IDS.has(itemId));
}

/** Archetypes with no 1:1 Swagkey product (diagram + recommend axis only). */
const REFERENCE_ONLY_LAYOUT_IDS = new Set(["layout-007"]);

export function isReferenceOnlyLayoutArchetype(itemId?: string): boolean {
  return Boolean(itemId && REFERENCE_ONLY_LAYOUT_IDS.has(itemId));
}

export function swagkeyProductLinkLabel(domain?: string, itemId?: string): string {
  if (domain?.toLowerCase() === "layout" && isAbstractLayoutId(itemId)) {
    return "이 배열의 대표 키트 보기";
  }
  const family = domain?.toLowerCase();
  if (family === "switch") return "스웨그키에서 스위치 보기";
  if (family === "plate") return "스웨그키에서 플레이트 보기";
  if (family === "foam") return "스웨그키에서 폼 보기";
  if (family === "case") return "스웨그키에서 케이스 보기";
  if (family === "keycap") return "스웨그키에서 키캡 보기";
  if (family === "layout") return "스웨그키에서 키트 보기";
  return "스웨그키에서 제품 보기";
}
