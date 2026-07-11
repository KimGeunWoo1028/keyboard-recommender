/** Seed-aligned metadata for layout browse cards (list API omits metadata on summaries). */
export const LAYOUT_ARCHETYPE_METADATA: Record<string, Record<string, unknown>> = {
  "layout-001": {
    layout_size: "60",
    typing_density: 5,
    has_arrow_cluster: false,
    has_function_row: false,
    is_exploded: false,
  },
  "layout-002": {
    layout_size: "65",
    typing_density: 6,
    has_arrow_cluster: true,
    has_function_row: false,
    is_exploded: false,
  },
  "layout-003": {
    layout_size: "80_tkl",
    typing_density: 7,
    has_arrow_cluster: true,
    has_function_row: true,
    is_exploded: false,
  },
  "layout-004": {
    layout_size: "full",
    typing_density: 9,
    has_arrow_cluster: true,
    has_function_row: true,
    is_exploded: false,
  },
  "layout-005": {
    layout_size: "75",
    typing_density: 7,
    has_arrow_cluster: true,
    has_function_row: true,
    is_exploded: true,
  },
  "layout-006": {
    layout_size: "alice",
    typing_density: 6,
    has_arrow_cluster: true,
    has_function_row: false,
    is_exploded: false,
  },
  "layout-007": {
    layout_size: "split",
    typing_density: 4,
    has_arrow_cluster: false,
    has_function_row: false,
    is_exploded: false,
  },
};

export function layoutArchetypeMetadata(partId: string): Record<string, unknown> {
  return LAYOUT_ARCHETYPE_METADATA[partId] ?? {};
}
