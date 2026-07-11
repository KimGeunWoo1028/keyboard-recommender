/**
 * Recommendation engine (score-based, no AI)
 * ============================================
 *
 * Architecture
 * ------------
 * 1. **Canonical traits** (`traits.ts`) — fixed axes (`deep_sound`, `clacky`, `soft`, `firm`,
 *    `smooth`, `tactile_strength`). Add keys here to extend the model; propagate to catalog items.
 * 2. **Catalog models** (`models.ts`) — switches, plates, foam stacks, layouts each carry
 *    `traitMetadata: Partial<EngineTraitVector>` describing how “strong” that part is on each axis.
 * 3. **User vector** (`user-vector.ts`) — survey `TraitAccumulator` + `SurveyAnswers` map into the
 *    same axes with weighted bonuses (tunable constants).
 * 4. **Vector math** (`vector-math.ts`) — dot product, L2 normalize.
 * 5. **Scoring** (`scoring.ts`) — rank catalog rows by `defaultScore` (normalized user · item × popularity).
 *    Inject `scoreFn` for experiments (e.g. weighted penalties, min thresholds).
 * 6. **Dataset** (`dataset.sample.ts`) — in-memory sample; replace with API/DB loader keeping the same shapes.
 * 7. **Orchestration** (`recommend.ts`) — `recommendKeyboardStack` returns top pick per category + full ranks.
 *
 * Extension points
 * ----------------
 * - New part types: add to `RecommendationCatalog` + `recommendKeyboardStack`.
 * - New traits: extend `ENGINE_TRAIT_KEYS` and backfill catalog metadata.
 * - New survey fields: extend `buildUserPreferenceVector` mapping.
 */

export * from "@/recommendation-engine/traits";
export * from "@/recommendation-engine/models";
export * from "@/recommendation-engine/vector-math";
export * from "@/recommendation-engine/scoring";
export * from "@/recommendation-engine/user-vector";
export * from "@/recommendation-engine/dataset.sample";
export * from "@/recommendation-engine/recommend";
