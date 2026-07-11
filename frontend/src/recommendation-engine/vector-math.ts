import { ENGINE_TRAIT_KEYS, type EngineTraitVector } from "@/recommendation-engine/traits";

export function dot(a: EngineTraitVector, b: EngineTraitVector): number {
  let s = 0;
  for (const k of ENGINE_TRAIT_KEYS) {
    s += a[k] * b[k];
  }
  return s;
}

export function l2norm(a: EngineTraitVector): number {
  return Math.sqrt(dot(a, a));
}

/** Avoid division by zero — returns zero vector if norm is 0 */
export function normalizeL2(v: EngineTraitVector): EngineTraitVector {
  const n = l2norm(v);
  if (n === 0) {
    const z = { ...v };
    for (const k of ENGINE_TRAIT_KEYS) z[k] = 0;
    return z;
  }
  const out = { ...v };
  for (const k of ENGINE_TRAIT_KEYS) {
    out[k] = v[k] / n;
  }
  return out;
}

export function scaleVector(v: EngineTraitVector, s: number): EngineTraitVector {
  const out = { ...v };
  for (const k of ENGINE_TRAIT_KEYS) {
    out[k] = v[k] * s;
  }
  return out;
}
