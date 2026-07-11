import type { RecommendedBuild } from "@/types/recommendation";
import type { MatchExplanationItem, SurveySubmission } from "@/types/survey";

export const SWAGKEY_LINK_DOMAINS = ["switch", "plate", "foam"] as const;
export type SwagkeyLinkDomain = (typeof SWAGKEY_LINK_DOMAINS)[number];

export function isSwagkeyLinkDomain(domain: string): domain is SwagkeyLinkDomain {
  return (SWAGKEY_LINK_DOMAINS as readonly string[]).includes(domain.toLowerCase());
}

export function pickSourceUrlKey(domain: string, itemId: string): string {
  return `${domain.toLowerCase()}:${itemId}`;
}

export function normalizeSwagkeyProductUrl(url?: string): string {
  const raw = (url ?? "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    const idx = parsed.searchParams.get("idx");
    if (idx && /^\d+$/.test(idx)) {
      return `https://www.swagkey.kr/shop_view/?idx=${idx}`;
    }
  } catch {
    return raw;
  }
  return raw;
}

function collectSubmissionSourceUrls(submission: SurveySubmission): string[] {
  const urls: string[] = [];
  const picks = submission.recommendations ?? submission.matchExplanations ?? [];
  for (const pick of picks) {
    if (pick.sourceUrl?.trim()) urls.push(pick.sourceUrl.trim());
    for (const alt of pick.alternatives ?? []) {
      if (alt.sourceUrl?.trim()) urls.push(alt.sourceUrl.trim());
    }
  }
  for (const value of Object.values(submission.build?.sourceUrls ?? {})) {
    if (typeof value === "string" && value.trim()) urls.push(value.trim());
  }
  return urls;
}

export function isCanonicalSwagkeyProductUrl(url?: string): boolean {
  const raw = (url ?? "").trim();
  if (!raw) return false;
  return raw === normalizeSwagkeyProductUrl(raw);
}

export function submissionHasStaleSwagkeyUrls(submission: SurveySubmission): boolean {
  if (submission.source !== "api" || submission.apiUnreachableFallback) return false;
  return collectSubmissionSourceUrls(submission).some((url) => !isCanonicalSwagkeyProductUrl(url));
}

export function submissionMissingSwagkeyLinks(submission: SurveySubmission): boolean {
  if (submission.source !== "api" || submission.apiUnreachableFallback) return false;
  const picks = submission.recommendations ?? submission.matchExplanations ?? [];
  if (picks.length === 0) return false;

  const buildUrls = submission.build?.sourceUrls ?? {};
  for (const domain of SWAGKEY_LINK_DOMAINS) {
    if (buildUrls[domain]?.trim()) continue;
    const pick = picks.find((row) => row.domain.toLowerCase() === domain);
    if (!pick) continue;
    if (!(pick.sourceUrl ?? "").trim()) return true;
  }
  return false;
}

export function resolvePartSourceUrl(
  domain: SwagkeyLinkDomain,
  itemId: string,
  options: {
    build?: RecommendedBuild;
    picks?: Array<{
      domain: string;
      itemId: string;
      sourceUrl?: string;
      alternatives?: Array<{ itemId: string; sourceUrl?: string }>;
    }>;
    enrichedUrls?: Record<string, string>;
  },
): string {
  return resolvePickSourceUrl(domain, itemId, options);
}

export function resolvePickSourceUrl(
  domain: string,
  itemId: string,
  options: {
    build?: RecommendedBuild;
    picks?: Array<{
      domain: string;
      itemId: string;
      sourceUrl?: string;
      alternatives?: Array<{ itemId: string; sourceUrl?: string }>;
    }>;
    enrichedUrls?: Record<string, string>;
  },
): string {
  const normalizedDomain = domain.toLowerCase();
  const fromEnriched = options.enrichedUrls?.[pickSourceUrlKey(normalizedDomain, itemId)]?.trim();
  if (fromEnriched) return normalizeSwagkeyProductUrl(fromEnriched);

  for (const row of options.picks ?? []) {
    if (row.domain.toLowerCase() !== normalizedDomain) continue;
    if (row.itemId === itemId && row.sourceUrl?.trim()) {
      return normalizeSwagkeyProductUrl(row.sourceUrl);
    }
    for (const alt of row.alternatives ?? []) {
      if (alt.itemId === itemId && alt.sourceUrl?.trim()) {
        return normalizeSwagkeyProductUrl(alt.sourceUrl);
      }
    }
  }

  const primaryPick = options.picks?.find((row) => row.domain.toLowerCase() === normalizedDomain);
  const buildUrls = options.build?.sourceUrls ?? {};
  const fromBuild = buildUrls[normalizedDomain as keyof typeof buildUrls]?.trim();
  if (fromBuild && primaryPick?.itemId === itemId) {
    return normalizeSwagkeyProductUrl(fromBuild);
  }

  return "";
}

export function submissionNeedsSwagkeyUrlRefresh(submission: SurveySubmission): boolean {
  return submissionMissingSwagkeyLinks(submission) || submissionHasStaleSwagkeyUrls(submission);
}

/** True when API picks lack product thumbnails (e.g. session saved before imageUrl shipped). */
export function submissionNeedsImageUrlRefresh(submission: SurveySubmission): boolean {
  if (submission.source !== "api" || submission.apiUnreachableFallback) return false;
  const picks = submission.recommendations ?? submission.matchExplanations ?? [];
  if (picks.length === 0) return false;
  for (const pick of picks) {
    if ((pick.imageUrl ?? "").trim()) continue;
    return true;
  }
  return false;
}
