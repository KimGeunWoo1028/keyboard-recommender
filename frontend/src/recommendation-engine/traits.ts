/**
 * Canonical trait axes for score-based matching (no AI).
 * Extend `ENGINE_TRAIT_KEYS` to add new dimensions — keep `EngineTraitVector` in sync via `Record`.
 *
 * Semantics (component metadata & user preference use the same axes):
 * - deep_sound: low-pitched / thocky tendency
 * - clacky: sharp, articulate, bright hits
 * - soft: cushioned bottom-out / dampening-friendly
 * - firm: hard stop / rigid feedback
 * - smooth: glide / no tactile bump (linear feel)
 * - tactile_strength: bump prominence (inverse of “smooth” for switches)
 */

export const ENGINE_TRAIT_KEYS = [
  "deep_sound",
  "clacky",
  "soft",
  "firm",
  "smooth",
  "tactile_strength",
] as const;

export type EngineTraitId = (typeof ENGINE_TRAIT_KEYS)[number];

/** Dense user or normalized preference vector — one score per trait. */
export type EngineTraitVector = Record<EngineTraitId, number>;

/** Sparse metadata on catalog items (omit axes that are neutral). */
export type TraitMetadata = Partial<EngineTraitVector>;

export function emptyEngineVector(): EngineTraitVector {
  return {
    deep_sound: 0,
    clacky: 0,
    soft: 0,
    firm: 0,
    smooth: 0,
    tactile_strength: 0,
  };
}

export function expandTraitMetadata(meta: TraitMetadata): EngineTraitVector {
  const v = emptyEngineVector();
  for (const key of ENGINE_TRAIT_KEYS) {
    const x = meta[key];
    if (typeof x === "number") v[key] = x;
  }
  return v;
}

export function addEngineVectors(a: EngineTraitVector, b: TraitMetadata, scale = 1): EngineTraitVector {
  const out = { ...a };
  for (const key of ENGINE_TRAIT_KEYS) {
    const d = b[key];
    if (typeof d === "number") out[key] += d * scale;
  }
  return out;
}
