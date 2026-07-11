/**
 * Trait conversion: dictionary senses → merged `TraitMetadata`.
 *
 * Beginner mental model:
 * 1. Each **term** may have **several senses** (meanings).
 * 2. Pick one sense, or **blend** all senses for that term.
 * 3. Combine **multiple terms** with sum / average / max along each axis.
 */

import { ENGINE_TRAIT_KEYS } from "@/recommendation-engine/traits";
import { lookupDictionaryEntry } from "@/keyboard-terminology/indexes";
import { defaultTokenize, normalizeCommunityTerm } from "@/keyboard-terminology/normalize";
import type {
  MultiTokenMergeStrategy,
  SensePickStrategy,
  TermDictionaryEntry,
  TermResolution,
  TermSense,
  TraitMetadata,
} from "@/keyboard-terminology/types";

function emptyTraitDelta(): TraitMetadata {
  return {};
}

/** Pick how to handle multiple senses on one entry. */
export function pickSense(entry: TermDictionaryEntry, strategy: SensePickStrategy): TermSense {
  const senses = entry.senses;
  if (senses.length === 0) {
    throw new Error(`pickSense: entry "${entry.canonical}" has no senses`);
  }
  if (strategy === "first") return senses[0]!;
  if (strategy === "highestConfidence") {
    return [...senses].sort((a, b) => b.confidence - a.confidence)[0]!;
  }
  /* blend: average non-zero boosts per axis across senses */
  const blendedBoost: TraitMetadata = {};
  const counts: Partial<Record<string, number>> = {};
  for (const s of senses) {
    for (const k of ENGINE_TRAIT_KEYS) {
      const v = s.traitBoost[k];
      if (typeof v === "number" && v !== 0) {
        blendedBoost[k] = (blendedBoost[k] ?? 0) + v;
        counts[k] = (counts[k] ?? 0) + 1;
      }
    }
  }
  for (const k of ENGINE_TRAIT_KEYS) {
    const c = counts[k];
    if (c && blendedBoost[k] !== undefined) {
      blendedBoost[k] = blendedBoost[k]! / c;
    }
  }
  return {
    id: `${entry.canonical}:blended`,
    description: `Blended interpretation of: ${senses.map((x) => x.id).join(", ")}`,
    traitBoost: blendedBoost,
    confidence: Math.max(...senses.map((s) => s.confidence)),
  };
}

/** Merge sparse boosts from several terms into one vector-ish object. */
export function mergeTraitBoosts(boosts: TraitMetadata[], strategy: MultiTokenMergeStrategy): TraitMetadata {
  if (boosts.length === 0) return {};
  if (strategy === "sum") {
    const out: TraitMetadata = {};
    for (const b of boosts) {
      for (const k of ENGINE_TRAIT_KEYS) {
        const v = b[k];
        if (typeof v === "number") out[k] = (out[k] ?? 0) + v;
      }
    }
    return out;
  }
  if (strategy === "max") {
    const out: TraitMetadata = {};
    for (const b of boosts) {
      for (const k of ENGINE_TRAIT_KEYS) {
        const v = b[k];
        if (typeof v === "number") out[k] = Math.max(out[k] ?? 0, v);
      }
    }
    return out;
  }
  /* average */
  const summed = mergeTraitBoosts(boosts, "sum");
  const n = boosts.length;
  const out: TraitMetadata = {};
  for (const k of ENGINE_TRAIT_KEYS) {
    const v = summed[k];
    if (typeof v === "number") out[k] = v / n;
  }
  return out;
}

export type ResolveOptions = {
  sensePick: SensePickStrategy;
  tokenMerge: MultiTokenMergeStrategy;
  /** Override tokenizer (e.g. future NLP). */
  tokenize?: (input: string) => string[];
};

const defaultResolveOptions: ResolveOptions = {
  sensePick: "highestConfidence",
  tokenMerge: "sum",
  tokenize: defaultTokenize,
};

/**
 * Convert free text or a phrase into structured trait deltas + notes.
 * Unknown tokens are skipped (no throw).
 */
export function communityTextToTraits(input: string, options: Partial<ResolveOptions> = {}): TermResolution {
  const { sensePick, tokenMerge, tokenize } = { ...defaultResolveOptions, ...options };
  const tokens = tokenize!(input);

  const matchedTokens: string[] = [];
  const senseIds: string[] = [];
  const beginnerNotes: string[] = [];
  const boosts: TraitMetadata[] = [];

  for (const rawTok of tokens) {
    const entry = lookupDictionaryEntry(rawTok);
    if (!entry) continue;

    matchedTokens.push(entry.canonical);
    const sense = entry.senses.length === 1 ? entry.senses[0]! : pickSense(entry, sensePick);
    senseIds.push(sense.id);
    boosts.push(sense.traitBoost);
    beginnerNotes.push(`${normalizeCommunityTerm(entry.canonical)} — ${entry.glossary} (${sense.description})`);
  }

  return {
    beginnerNotes,
    matchedTokens,
    senseIds,
    traitDelta: mergeTraitBoosts(boosts, tokenMerge),
  };
}

/** Map a single known term (after normalize) — handy for dropdowns. */
export function termToTraitDelta(
  term: string,
  sensePick: SensePickStrategy = "highestConfidence",
): { delta: TraitMetadata; sense: TermSense; entry: TermDictionaryEntry } | null {
  const entry = lookupDictionaryEntry(term);
  if (!entry) return null;
  const sense = entry.senses.length === 1 ? entry.senses[0]! : pickSense(entry, sensePick);
  return { delta: { ...sense.traitBoost }, entry, sense };
}
