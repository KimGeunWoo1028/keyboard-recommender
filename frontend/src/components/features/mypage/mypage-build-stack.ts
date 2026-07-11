import type { SavedRecommendationItem } from "@/lib/api/saved-recommendations";

export const COMPONENT_ROWS = [
  { keys: ["switches", "switch"], label: "스위치" },
  { keys: ["plate"], label: "플레이트" },
  { keys: ["foam"], label: "폼" },
  { keys: ["layout"], label: "레이아웃" },
  { keys: ["case"], label: "케이스" },
  { keys: ["keycap"], label: "키캡" },
] as const;

export type StackPart = {
  key: string;
  label: string;
  name: string;
  detail?: string;
};

export function splitComponentText(raw: string): { name: string; detail?: string } {
  const trimmed = raw.trim();
  const sep = trimmed.includes(" — ") ? " — " : trimmed.includes(" - ") ? " - " : null;
  if (!sep) return { name: trimmed };
  const [name, ...rest] = trimmed.split(sep);
  const detail = rest.join(sep).trim();
  return detail ? { name: name.trim(), detail } : { name: trimmed };
}

export function buildStackParts(item: SavedRecommendationItem): StackPart[] {
  const parts: StackPart[] = [];
  for (const row of COMPONENT_ROWS) {
    let raw: string | null = null;
    for (const key of row.keys) {
      const value = item.components?.[key];
      if (typeof value === "string" && value.trim()) {
        raw = value.trim();
        break;
      }
    }
    if (!raw) continue;
    const { name, detail } = splitComponentText(raw);
    parts.push({ key: row.keys[0], label: row.label, name, detail });
  }
  return parts;
}

export function savedItemKey(item: SavedRecommendationItem): string {
  return `${item.request_id}:${item.build_id}:${item.saved_at}`;
}
