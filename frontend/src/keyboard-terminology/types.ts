/**
 * Sound & feel terminology ↔ internal trait axes.
 *
 * Internal traits always use `EngineTraitId` from the recommendation engine.
 * Community words are *hints* that boost or describe those axes — they are not a second truth source.
 */

import type { EngineTraitId, TraitMetadata } from "@/recommendation-engine/traits";

/** One interpretable reading of a community term (polysemy / context). */
export interface TermSense {
  /** Stable id, e.g. `thocky:default` — useful for logging and future ML disambiguation. */
  id: string;
  /** When this sense applies (beginner-facing). */
  description: string;
  /**
   * Relative emphasis on each canonical axis (roughly same 0–10-ish scale as catalog metadata).
   * Omitted axes are neutral (0 contribution from this sense).
   */
  traitBoost: TraitMetadata;
  /** If several senses exist, higher values are preferred by `highestConfidence` strategy. Default 0.5. */
  confidence: number;
}

/** A community term and how it maps into structured traits. */
export interface TermDictionaryEntry {
  /** Primary lookup key (lowercase). */
  canonical: string;
  /** Extra surface forms: "thock", "thocc", etc. */
  aliases: string[];
  /** One or more meanings — see `MERGE_STRATEGIES` in `convert.ts`. */
  senses: TermSense[];
  /** Short glossary line for UI tooltips. */
  glossary: string;
}

/** How to collapse multiple senses for one token into one vector contribution. */
export type SensePickStrategy = "first" | "highestConfidence" | "blend";

/** How to combine contributions from multiple tokens. */
export type MultiTokenMergeStrategy = "sum" | "average" | "max";

/**
 * Result of resolving free text or a list of tokens.
 * Designed so a future `NlpTerminologyResolver` can fill the same shape.
 */
export interface TermResolution {
  /** Normalized tokens that matched the dictionary. */
  matchedTokens: string[];
  /** For each matched token, which sense id was used (after disambiguation). */
  senseIds: string[];
  /** Merged sparse boost across all matches. */
  traitDelta: TraitMetadata;
  /** Glossary / sense descriptions for UI. */
  beginnerNotes: string[];
}

/**
 * Pluggable resolver — swap implementations without changing call sites.
 * - `dictionary`: today's keyword + alias lookup.
 * - `nlp`: future embeddings / classifier (same interface).
 */
export interface TerminologyResolver {
  readonly kind: "dictionary" | "nlp";
  resolve(input: string): TermResolution;
}

/** Optional hook for NLP: structured spans instead of whitespace tokens. */
export interface Tokenizer {
  tokenize(input: string): string[];
}

export type { EngineTraitId, TraitMetadata };
