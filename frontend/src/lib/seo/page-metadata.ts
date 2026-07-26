import type { Metadata } from "next";

/**
 * Site SEO helpers — paths match `sitemap.ts` / App Router links:
 * no trailing slash except the site root `/`.
 */
export function normalizeSeoPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") return "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

type PublicPageMetadataInput = {
  path: string;
  /** Segment title (uses root `%s · Keyboard Recommender` template) or absolute title object. */
  title: NonNullable<Metadata["title"]>;
  description: string;
  /** Defaults from string title, or must be set when title is absolute. */
  openGraphTitle?: string;
};

/** Indexable marketing / legal surfaces with self-canonical. */
export function publicPageMetadata({
  path,
  title,
  description,
  openGraphTitle,
}: PublicPageMetadataInput): Metadata {
  const canonical = normalizeSeoPath(path);
  const ogTitle =
    openGraphTitle ??
    (typeof title === "string" ? `${title} · Keyboard Recommender` : "Keyboard Recommender");
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
    },
  };
}

type PrivatePageMetadataInput = {
  path: string;
  title: NonNullable<Metadata["title"]>;
  description?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
};

/**
 * Account / personalized surfaces: noindex + self-canonical
 * (never point canonical at `/`).
 */
export function privatePageMetadata({
  path,
  title,
  description,
  openGraphTitle,
  openGraphDescription,
}: PrivatePageMetadataInput): Metadata {
  const canonical = normalizeSeoPath(path);
  const ogDescription = openGraphDescription ?? description;
  const ogTitle =
    openGraphTitle ??
    (typeof title === "string" ? `${title} · Keyboard Recommender` : "Keyboard Recommender");
  return {
    title,
    ...(description ? { description } : {}),
    robots: { index: false, follow: false },
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      ...(ogDescription ? { description: ogDescription } : {}),
      url: canonical,
    },
  };
}
