import { ApiError, getPublicApiBase, readErrorMessage } from "@/lib/api/client";

export type CatalogFamily = "switch" | "plate" | "foam" | "layout" | "case" | "keycap";

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

/** Resolve API-relative mirror paths (e.g. /media/swagkey-images/1792.jpg) for next/image. */
export function resolveCatalogImageUrl(imageUrl: string): string {
  const trimmed = imageUrl.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/layout-diagrams/")) return trimmed;
  const base = getPublicApiBase();
  if (!base) return trimmed;
  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
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

export async function fetchCatalogList(
  family: CatalogFamily,
  options?: { subtype?: string; layoutSize?: string; q?: string; limit?: number; offset?: number },
): Promise<CatalogListResponse> {
  const base = getPublicApiBase();
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
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new ApiError(res.status, await readErrorMessage(res));
  }
  return parseCatalogListResponse(await res.json());
}

export async function fetchCatalogPart(family: CatalogFamily, partId: string): Promise<CatalogPartDetail> {
  const base = getPublicApiBase();
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
