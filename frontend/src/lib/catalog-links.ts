import type { CatalogFamily } from "@/lib/api/catalog";

export function catalogHref(options?: {
  family?: CatalogFamily;
  subtype?: string;
  layoutSize?: string;
  q?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.family) params.set("family", options.family);
  if (options?.subtype) params.set("subtype", options.subtype);
  if (options?.layoutSize?.trim()) params.set("layoutSize", options.layoutSize.trim());
  if (options?.q?.trim()) params.set("q", options.q.trim());
  const qs = params.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}
