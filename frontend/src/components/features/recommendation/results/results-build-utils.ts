import {
  isSwagkeyLinkDomain,
  normalizeSwagkeyProductUrl,
  resolvePartSourceUrl,
  resolvePickSourceUrl,
} from "@/lib/swagkey-source-links";
import type { RecommendedBuild } from "@/types/recommendation";

export const BUILD_DOMAIN_KEYS = ["switch", "plate", "foam", "layout", "case", "keycap"] as const;
export type BuildDomainKey = (typeof BUILD_DOMAIN_KEYS)[number];

export const BUILD_DOMAIN_LABELS: Record<BuildDomainKey, string> = {
  switch: "스위치",
  plate: "플레이트",
  foam: "폼",
  layout: "레이아웃",
  case: "케이스/키트",
  keycap: "키캡",
};

export function catalogPickMetadata(picks: Array<{ domain: string; itemId: string }>): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const p of picks) {
    const d = p.domain.toLowerCase();
    if (d === "switch" || d === "switches") meta.switchId = p.itemId;
    else if (d === "plate" || d === "plates") meta.plateId = p.itemId;
    else if (d === "foam" || d === "foams") meta.foamId = p.itemId;
    else if (d === "layout" || d === "layouts") meta.layoutId = p.itemId;
    else if (d === "case" || d === "cases") meta.caseId = p.itemId;
  }
  const primary = meta.switchId ?? picks[0]?.itemId;
  if (primary) meta.itemId = primary;
  return meta;
}

export function formatScore(n: number): string {
  return n.toFixed(2);
}

/** User-facing band instead of raw similarity decimals (UX). */
export function formatScoreBand(n: number): string {
  if (!Number.isFinite(n)) return "참고용";
  if (n >= 0.7) return "매우 비슷함";
  if (n >= 0.55) return "비슷함";
  if (n >= 0.4) return "조금 다름";
  return "다른 성향";
}

export function domainDisplayLabel(domain: string): string {
  const d = domain.toLowerCase();
  const map: Record<string, string> = {
    switch: "스위치",
    switches: "스위치",
    plate: "플레이트",
    plates: "플레이트",
    foam: "폼",
    foams: "폼",
    layout: "레이아웃",
    layouts: "레이아웃",
    case: "케이스/키트",
    cases: "케이스/키트",
  };
  return map[d] ?? (domain ? domain.charAt(0).toUpperCase() + domain.slice(1) : domain);
}

export function pickDisplayName(pick: { itemId: string; itemName?: string }): string {
  const label = (pick.itemName ?? "").trim();
  return label || pick.itemId;
}

export function splitBuildComponentText(raw?: string | null): { name: string; description: string } {
  const cleaned = (raw ?? "").replace(/\s*\(https?:\/\/[^\s)]+\)\s*$/i, "").trim();
  if (!cleaned) {
    return { name: "—", description: "" };
  }
  const sep = " — ";
  if (!cleaned.includes(sep)) {
    return { name: cleaned, description: "" };
  }
  const [name, ...rest] = cleaned.split(sep);
  return { name: (name ?? "").trim(), description: rest.join(sep).trim() };
}

export function buildComponentDisplayText(
  build: RecommendedBuild,
  domain: BuildDomainKey,
  picks: Array<{ domain: string; itemId: string; itemName?: string }>,
): string {
  const fromBuild: Record<BuildDomainKey, string | undefined> = {
    switch: build.switches,
    plate: build.plate,
    foam: build.foam,
    layout: build.layout,
    case: build.case,
    keycap: build.keycap,
  };
  const direct = (fromBuild[domain] ?? "").trim();
  if (direct) return direct;

  const pick = picks.find((p) => p.domain.toLowerCase() === domain);
  if (pick) {
    const name = (pick.itemName ?? "").trim();
    if (name) return name;
    if (pick.itemId.trim()) return pick.itemId;
  }
  return "";
}

export function buildPartSourceUrl(
  build: RecommendedBuild,
  domain: BuildDomainKey,
  picks: Array<{ domain: string; itemId: string; sourceUrl?: string }>,
  enrichedUrls: Record<string, string>,
): string {
  if (domain === "layout" || domain === "case" || domain === "keycap") {
    const pick = picks.find((p) => p.domain.toLowerCase() === domain);
    const raw = pick?.sourceUrl?.trim() ?? build.sourceUrls?.[domain]?.trim() ?? "";
    return raw ? normalizeSwagkeyProductUrl(raw) : "";
  }
  if (!isSwagkeyLinkDomain(domain)) {
    const pick = picks.find((p) => p.domain.toLowerCase() === domain);
    return pick?.sourceUrl?.trim() ? normalizeSwagkeyProductUrl(pick.sourceUrl) : "";
  }
  const pick = picks.find((p) => p.domain.toLowerCase() === domain);
  const itemId = pick?.itemId ?? build.engineScores?.[`${domain}Id` as "switchId" | "plateId" | "foamId"] ?? "";
  if (!itemId) return "";
  return resolvePartSourceUrl(domain, itemId, { build, picks, enrichedUrls });
}

export function pickRowSourceUrl(
  pick: { domain: string; itemId: string; sourceUrl?: string },
  build: RecommendedBuild,
  picks: Array<{
    domain: string;
    itemId: string;
    sourceUrl?: string;
    alternatives?: Array<{ itemId: string; sourceUrl?: string }>;
  }>,
  enrichedUrls: Record<string, string>,
): string {
  const direct = pick.sourceUrl?.trim();
  if (direct) return normalizeSwagkeyProductUrl(direct);

  const domain = pick.domain.toLowerCase();
  if (domain === "layout" || domain === "case" || domain === "keycap") {
    return resolvePickSourceUrl(domain, pick.itemId, { build, picks, enrichedUrls });
  }
  if (isSwagkeyLinkDomain(domain)) {
    return resolvePartSourceUrl(domain, pick.itemId, { build, picks, enrichedUrls });
  }
  return "";
}
