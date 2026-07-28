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

/** Switch · plate · keycap blurb for Manus-style saved cards. */
export function savedPartsOneLiner(item: SavedRecommendationItem): string | null {
  const parts = buildStackParts(item);
  const byKey = (keys: string[]) =>
    parts.find((part) => keys.includes(part.key))?.name?.trim() || null;
  const bits = [
    byKey(["switches", "switch"]),
    byKey(["plate"]),
    byKey(["keycap"]),
  ].filter((value): value is string => Boolean(value));
  if (!bits.length) return null;
  return `· ${bits.join(" · ")}`;
}

/** Prefer snapshot confidence stored on the bookmark metadata. */
export function savedMatchPercent(item: SavedRecommendationItem): number | null {
  const snap = item.metadata?.resultSnapshot;
  if (snap && typeof snap === "object" && !Array.isArray(snap)) {
    const overall = (snap as { overallConfidence?: unknown }).overallConfidence;
    if (typeof overall === "number" && Number.isFinite(overall)) {
      return Math.max(0, Math.min(100, Math.round(overall * 100)));
    }
    const band = (snap as { recommendationConfidence?: { overall?: unknown } }).recommendationConfidence
      ?.overall;
    if (typeof band === "number" && Number.isFinite(band)) {
      return Math.max(0, Math.min(100, Math.round(band * 100)));
    }
  }

  for (const key of ["overallConfidence", "matchPercent", "preferenceMatch"] as const) {
    const raw = item.metadata?.[key];
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return raw <= 1 ? Math.max(0, Math.min(100, Math.round(raw * 100))) : Math.max(0, Math.min(100, Math.round(raw)));
    }
  }
  return null;
}
