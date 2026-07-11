/**
 * Fast lookup: canonical key + alias → entry.
 * Keeps `dictionary.ts` as data-only rows beginners can skim.
 */

import { TERMINOLOGY_DICTIONARY } from "@/keyboard-terminology/dictionary";
import type { TermDictionaryEntry } from "@/keyboard-terminology/types";
import { normalizeCommunityTerm } from "@/keyboard-terminology/normalize";

export type TermIndex = {
  byCanonical: ReadonlyMap<string, TermDictionaryEntry>;
  /** alias (normalized) → canonical key */
  aliasToCanonical: ReadonlyMap<string, string>;
};

let cached: TermIndex | null = null;

export function getTermIndex(): TermIndex {
  if (cached) return cached;

  const byCanonical = new Map<string, TermDictionaryEntry>();
  const aliasToCanonical = new Map<string, string>();

  for (const entry of TERMINOLOGY_DICTIONARY) {
    const key = normalizeCommunityTerm(entry.canonical);
    byCanonical.set(key, entry);
    for (const a of entry.aliases) {
      aliasToCanonical.set(normalizeCommunityTerm(a), key);
    }
  }

  cached = { aliasToCanonical, byCanonical };
  return cached;
}

/** Resolve any surface form to a dictionary entry, if known. */
export function lookupDictionaryEntry(raw: string): TermDictionaryEntry | undefined {
  const key = normalizeCommunityTerm(raw);
  const { aliasToCanonical, byCanonical } = getTermIndex();
  const canonical = aliasToCanonical.get(key) ?? key;
  return byCanonical.get(canonical);
}
