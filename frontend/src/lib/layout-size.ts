export const LAYOUT_SIZE_SHORT_LABELS: Record<string, string> = {
  "40": "40%",
  "60": "60%",
  "65": "65%",
  "75": "75%",
  "80_tkl": "TKL",
  "96": "96%",
  full: "Full",
  alice: "Alice",
  split: "Split",
};

export const LAYOUT_SIZE_FILTER_LABELS: Record<string, string> = {
  "40": "40% 배열",
  "60": "60% 배열",
  "65": "65% 배열",
  "75": "75% 배열",
  "80_tkl": "TKL 배열",
  "96": "96% 배열",
  full: "풀사이즈 배열",
  alice: "Alice 배열",
  split: "스플릿 배열",
};

export function layoutSizeShortLabel(size: string): string {
  const key = size.trim();
  return LAYOUT_SIZE_SHORT_LABELS[key] ?? key;
}

export function layoutSizeFilterLabel(size: string): string {
  const key = size.trim();
  return LAYOUT_SIZE_FILTER_LABELS[key] ?? `${key} 배열`;
}

export function normalizeLayoutSizes(
  layoutSize?: string | null,
  compatibleLayoutSizes?: string[] | null,
): string[] {
  const sizes: string[] = [];
  const primary = (layoutSize ?? "").trim();
  if (primary) sizes.push(primary);
  for (const raw of compatibleLayoutSizes ?? []) {
    const value = String(raw).trim();
    if (value && !sizes.includes(value)) sizes.push(value);
  }
  return sizes;
}

export function resolveLayoutSizeFromMetadata(metadata: Record<string, unknown>): string | null {
  const primary = metadata.layout_size;
  if (typeof primary === "string" && primary.trim()) return primary.trim();
  const compat = metadata.compatible_layout_sizes;
  if (Array.isArray(compat)) {
    for (const item of compat) {
      const value = String(item).trim();
      if (value) return value;
    }
  }
  return null;
}
