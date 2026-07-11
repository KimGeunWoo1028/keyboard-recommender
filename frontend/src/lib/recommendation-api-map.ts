import { emptyTraits, type TraitAccumulator } from "@/types/traits";

/** Map API `legacyTraits` into the in-app trait accumulator (camelCase keys). */
export function legacyTraitsFromApi(raw: Record<string, number>): TraitAccumulator {
  const out = emptyTraits();
  (Object.keys(out) as (keyof TraitAccumulator)[]).forEach((key) => {
    const v = raw[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      out[key] = v;
    }
  });
  return out;
}
