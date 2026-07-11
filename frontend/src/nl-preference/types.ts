/**
 * Natural-language preference → engine traits.
 *
 * Design:
 * - **NlPreferenceParser** is the only extension point for “smarter” analysis later (embeddings, LLM).
 * - **NlParseResult** stays stable so UI and `recommendKeyboardStack` do not care which parser ran.
 * - **`method`** tags the pipeline for telemetry and A/B without branching business logic everywhere.
 */

import type { TraitMetadata } from "@/recommendation-engine/traits";

export type NlParseMethod = "rules" | "model";

/** Output of any NL parser implementation (rules today, model tomorrow). */
export interface NlParseResult {
  /** Sparse boosts on the same axes as the recommendation engine. */
  traitDelta: TraitMetadata;
  /** Human-readable trace (debug, tooltips, future “why”). */
  matchedPhrases: string[];
  matchedDictionaryTerms: string[];
  /** Free-form notes (e.g. terminology glossary lines). */
  notes: string[];
  method: NlParseMethod;
}

/**
 * Pluggable parser — swap `simpleNlPreferenceParser` for an AI-backed class without
 * changing `buildPreferenceVectorFromSubmission` call sites.
 */
export interface NlPreferenceParser {
  readonly kind: NlParseMethod;
  parse(input: string): NlParseResult;
}
