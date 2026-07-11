/**
 * Score-based matching: normalized user vector · expanded item trait vector.
 * Extensible: pass a custom `scoreFn` (e.g. weighted axes, mismatch penalties).
 */

import type { CatalogItem, ScoredComponent } from "@/recommendation-engine/models";
import { expandTraitMetadata, type EngineTraitVector } from "@/recommendation-engine/traits";
import { dot, normalizeL2 } from "@/recommendation-engine/vector-math";

export type NormalizedUser = ReturnType<typeof normalizeL2>;

export type ScoreFn = (userNorm: NormalizedUser, item: CatalogItem) => number;

export function defaultScore(userNorm: NormalizedUser, item: CatalogItem): number {
  const itemVec = expandTraitMetadata(item.traitMetadata);
  return dot(userNorm, itemVec) * (item.popularityWeight ?? 1);
}

export function rankComponents<T extends CatalogItem>(
  userPreference: EngineTraitVector,
  items: T[],
  options?: { topK?: number; scoreFn?: ScoreFn },
): ScoredComponent<T>[] {
  const scoreFn = options?.scoreFn ?? defaultScore;
  const topK = options?.topK ?? items.length;
  const userNorm = normalizeL2(userPreference);

  const scored = items.map((item) => {
    const itemVec = expandTraitMetadata(item.traitMetadata);
    const rawDot = dot(userNorm, itemVec);
    const score = scoreFn(userNorm, item);
    return { item, score, rawDot };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
