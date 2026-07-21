import { ApiError, getApiBaseForFetch, getPublicApiBase, readErrorMessage } from "@/lib/api/client";

export type CatalogFamily = "switch" | "plate" | "foam" | "layout" | "case" | "keycap";

function isRetryableCatalogStatus(status: number): boolean {
  return status === 0 || status === 502 || status === 503 || status === 504;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type CatalogPartSummary = {
  id: string;
  name: string;
  description: string;
  family: CatalogFamily;
  subtype: string;
  sourceUrl: string;
  imageUrl: string;
  popularityWeight: number;
  layoutSize?: string | null;
  compatibleLayoutSizes?: string[];
  referenceLayout?: boolean;
};

export type CatalogPartDetail = CatalogPartSummary & {
  traits: Record<string, number>;
  metadata: Record<string, unknown>;
};

export type CatalogListResponse = {
  family: CatalogFamily;
  items: CatalogPartSummary[];
  total: number;
  limit: number;
  offset: number;
  subtype: string | null;
  layoutSize: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isCatalogFamily(value: string): value is CatalogFamily {
  return (
    value === "switch" ||
    value === "plate" ||
    value === "foam" ||
    value === "layout" ||
    value === "case" ||
    value === "keycap"
  );
}

/**
 * True when `/media/...` should stay same-origin relative for next/image + rewrite.
 * Uses only NEXT_PUBLIC_* so SSR and the browser resolve identically —
 * branching on `window` / server-only `INTERNAL_*` caused React #418.
 */
function preferRelativeMediaUrl(publicApiBase: string): boolean {
  // Explicit same-origin media proxy (Next rewrite /media → backend).
  if (process.env.NEXT_PUBLIC_MEDIA_SAME_ORIGIN === "1") return true;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!site) return false;
  try {
    return new URL(site).origin === new URL(publicApiBase).origin;
  } catch {
    return false;
  }
}

/**
 * Resolve API-relative mirror paths for next/image.
 * Prefer same-origin `/media/...` when configured (site URL match or
 * NEXT_PUBLIC_MEDIA_SAME_ORIGIN=1) so the optimizer can resize via rewrite.
 */
export function resolveCatalogImageUrl(imageUrl: string): string {
  const trimmed = imageUrl.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/layout-diagrams/")) return trimmed;

  if (trimmed.startsWith("/media/")) {
    const base = getPublicApiBase();
    if (!base) return trimmed;
    // Same decision on server and client (no `window` / server-only INTERNAL_*).
    if (preferRelativeMediaUrl(base)) return trimmed;
    return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
  }

  const base = getPublicApiBase();
  if (!base) return trimmed;
  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

/**
 * Whether next/image should skip the optimizer for this resolved URL.
 * Relative `/media/...` and allowlisted absolute hosts are optimized.
 */
export function shouldSkipCatalogImageOptimization(resolvedSrc: string): boolean {
  if (!resolvedSrc) return true;
  if (resolvedSrc.startsWith("/media/")) return false;
  if (resolvedSrc.startsWith("/layout-diagrams/")) return false;
  try {
    const u = new URL(resolvedSrc);
    if (u.hostname === "cdn.imweb.me") return false;
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return false;
    const publicBase = getPublicApiBase();
    if (publicBase) {
      try {
        if (new URL(publicBase).hostname === u.hostname) return false;
      } catch {
        /* ignore */
      }
    }
    const internal = process.env.INTERNAL_API_PROXY_TARGET?.trim();
    if (internal) {
      try {
        if (new URL(internal).hostname === u.hostname) return false;
      } catch {
        /* ignore */
      }
    }
  } catch {
    return true;
  }
  // Unknown remote host (e.g. unexpected CDN) — keep rendering without optimizer.
  return true;
}

function parseSummary(raw: unknown): CatalogPartSummary | null {
  if (!isRecord(raw)) return null;
  const id = raw.id;
  const name = raw.name;
  const family = raw.family;
  if (typeof id !== "string" || typeof name !== "string" || typeof family !== "string") return null;
  if (!isCatalogFamily(family)) return null;
  return {
    id,
    name,
    description: typeof raw.description === "string" ? raw.description : "",
    family,
    subtype: typeof raw.subtype === "string" ? raw.subtype : "",
    sourceUrl: typeof raw.sourceUrl === "string" ? raw.sourceUrl : "",
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : "",
    popularityWeight: typeof raw.popularityWeight === "number" ? raw.popularityWeight : 1,
    layoutSize: typeof raw.layoutSize === "string" ? raw.layoutSize : null,
    compatibleLayoutSizes: Array.isArray(raw.compatibleLayoutSizes)
      ? raw.compatibleLayoutSizes.map(String).filter(Boolean)
      : [],
    referenceLayout: raw.referenceLayout === true,
  };
}

export function parseCatalogListResponse(raw: unknown): CatalogListResponse {
  if (!isRecord(raw)) {
    return { family: "switch", items: [], total: 0, limit: 50, offset: 0, subtype: null, layoutSize: null };
  }
  const familyRaw = raw.family;
  const family = typeof familyRaw === "string" && isCatalogFamily(familyRaw) ? familyRaw : "switch";
  const items = Array.isArray(raw.items)
    ? raw.items.map(parseSummary).filter((row): row is CatalogPartSummary => row !== null)
    : [];
  return {
    family,
    items,
    total: typeof raw.total === "number" ? raw.total : items.length,
    limit: typeof raw.limit === "number" ? raw.limit : 50,
    offset: typeof raw.offset === "number" ? raw.offset : 0,
    subtype: typeof raw.subtype === "string" ? raw.subtype : null,
    layoutSize: typeof raw.layoutSize === "string" ? raw.layoutSize : null,
  };
}

export function parseCatalogPartDetail(raw: unknown): CatalogPartDetail {
  const summary = parseSummary(raw);
  if (!summary || !isRecord(raw)) {
    throw new Error("invalid catalog part detail");
  }
  const traits: Record<string, number> = {};
  if (isRecord(raw.traits)) {
    for (const [k, v] of Object.entries(raw.traits)) {
      if (typeof v === "number" && Number.isFinite(v)) traits[k] = v;
    }
  }
  const metadata = isRecord(raw.metadata) ? raw.metadata : {};
  return { ...summary, traits, metadata };
}

const ENDPOINTS: Record<CatalogFamily, string> = {
  switch: "/api/v1/switches",
  plate: "/api/v1/plates",
  foam: "/api/v1/foam",
  layout: "/api/v1/layouts",
  case: "/api/v1/cases",
  keycap: "/api/v1/keycaps",
};

export const CATALOG_PAGE_SIZE = 24;

export function catalogListQueryKey(parts: {
  family: CatalogFamily;
  subtype?: string;
  layoutSize?: string;
  q?: string;
  page?: number;
}): string {
  const page = Math.max(1, parts.page ?? 1);
  return [
    parts.family,
    parts.subtype ?? "",
    (parts.layoutSize ?? "").trim(),
    (parts.q ?? "").trim(),
    String(page),
  ].join("|");
}

export async function fetchCatalogList(
  family: CatalogFamily,
  options?: {
    subtype?: string;
    layoutSize?: string;
    q?: string;
    limit?: number;
    offset?: number;
    /** Next.js fetch cache hint (SSR). Ignored in the browser. */
    next?: { revalidate?: number | false; tags?: string[] };
  },
): Promise<CatalogListResponse> {
  const base = getApiBaseForFetch();
  if (!base) {
    return {
      family,
      items: [],
      total: 0,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
      subtype: null,
      layoutSize: null,
    };
  }
  const params = new URLSearchParams();
  if (options?.subtype) params.set("subtype", options.subtype);
  if (options?.layoutSize?.trim()) params.set("layoutSize", options.layoutSize.trim());
  if (options?.q?.trim()) params.set("q", options.q.trim());
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.offset != null) params.set("offset", String(options.offset));
  const qs = params.toString();
  const url = `${base}${ENDPOINTS[family]}${qs ? `?${qs}` : ""}`;
  const init: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
    headers: { Accept: "application/json" },
  };
  if (typeof window === "undefined" && options?.next) {
    init.next = options.next;
  }

  let lastError: ApiError | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        lastError = new ApiError(res.status, await readErrorMessage(res));
        if (attempt < 2 && isRetryableCatalogStatus(lastError.status)) {
          await sleep(400 * (attempt + 1));
          continue;
        }
        throw lastError;
      }
      return parseCatalogListResponse(await res.json());
    } catch (err) {
      if (err instanceof ApiError) {
        lastError = err;
        if (attempt < 2 && isRetryableCatalogStatus(err.status)) {
          await sleep(400 * (attempt + 1));
          continue;
        }
        throw err;
      }
      lastError = new ApiError(0, "카탈로그 서버에 연결하지 못했습니다.");
      if (attempt < 2) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError ?? new ApiError(0, "카탈로그를 불러오지 못했습니다.");
}

export async function fetchCatalogPart(family: CatalogFamily, partId: string): Promise<CatalogPartDetail> {
  const base = getApiBaseForFetch();
  if (!base) {
    throw new ApiError(503, "API base URL is not configured");
  }
  const res = await fetch(`${base}${ENDPOINTS[family]}/${encodeURIComponent(partId)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new ApiError(res.status, await readErrorMessage(res));
  }
  return parseCatalogPartDetail(await res.json());
}
