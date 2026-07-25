import { buildStackParts } from "@/components/features/mypage/mypage-build-stack";
import { fixedAxisBars } from "@/components/features/recommendation/results/results-trait-display";
import type { SavedRecommendationItem } from "@/lib/api/saved-recommendations";

function readTraitScores(meta: Record<string, unknown> | undefined): Record<string, number> | null {
  const raw = meta?.userTraitScores;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
  }
  return Object.keys(out).length ? out : null;
}

/** List-row title: drop "추천 조합:" prefix and English parentheticals. */
export function shortSavedTitle(item: SavedRecommendationItem): string {
  let title = (item.title || item.build_id).trim();
  title = title.replace(/^추천\s*조합\s*:\s*/i, "");
  title = title.replace(/\s*\([^)]*\)/g, "");
  title = title.replace(/\s{2,}/g, " ").replace(/\s·\s/g, " · ").trim();
  return title || item.build_id;
}

export function shortSavedTitleLines(item: SavedRecommendationItem): [string, string?] {
  const title = shortSavedTitle(item);
  const parts = title
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts.slice(1).join(" · ")];
  return [title];
}

export function savedSwitchName(item: SavedRecommendationItem): string | null {
  const part = buildStackParts(item).find((row) => row.key === "switches" || row.key === "switch");
  return part?.name?.trim() || null;
}

export function savedLayoutName(item: SavedRecommendationItem): string | null {
  const part = buildStackParts(item).find((row) => row.key === "layout");
  return part?.name?.trim() || null;
}

/** Prefer metadata.preferenceTags; else top trait axes already stored on the bookmark. */
export function savedPreferenceTags(item: SavedRecommendationItem, limit = 3): string[] {
  const raw = item.metadata?.preferenceTags;
  if (Array.isArray(raw)) {
    return raw.filter((t): t is string => typeof t === "string" && t.trim().length > 0).slice(0, limit);
  }
  const scores = readTraitScores(item.metadata);
  if (!scores) return [];
  return fixedAxisBars(scores)
    .filter((bar) => bar.filledSegments >= 3)
    .slice(0, limit)
    .map((bar) => bar.label);
}

export function savedOneLineSummary(item: SavedRecommendationItem): string | null {
  const summary = (item.summary || "").trim();
  if (!summary) return null;
  // Drop engine-ish English taglines when too technical.
  if (/Matched via trait|score|vector/i.test(summary)) return null;
  return summary;
}
