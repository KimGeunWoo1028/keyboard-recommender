/**
 * Rule-based NL parser: phrase table + per-token `keyboard-terminology` + `WORD_BOOSTS`.
 *
 * Design choices:
 * - **No ML** — deterministic, fast, works offline; easy to unit-test.
 * - **Order**: longest phrases first (strip from string), then each remaining token → dictionary or word table.
 * - **No full-string terminology pass** — avoids double-counting; multi-word community flavor is still
 *   captured token-by-token ("thocky", "creamy", "muted").
 * - **AI-ready**: replace this object with a parser that returns the same `NlParseResult`.
 */

import { pickSense } from "@/keyboard-terminology/convert";
import { lookupDictionaryEntry } from "@/keyboard-terminology/indexes";
import { koreanStemCandidates, normalizeCommunityTerm } from "@/keyboard-terminology/normalize";
import { phrasePatternsLongestFirst } from "@/nl-preference/phrase-patterns";
import type { NlParseResult, NlPreferenceParser } from "@/nl-preference/types";
import { WORD_BOOSTS } from "@/nl-preference/word-boosts";
import { ENGINE_TRAIT_KEYS, type TraitMetadata } from "@/recommendation-engine/traits";

const STOPWORDS = new Set([
  "i",
  "want",
  "a",
  "an",
  "the",
  "with",
  "and",
  "or",
  "to",
  "for",
  "of",
  "in",
  "on",
  "at",
  "my",
  "me",
  "is",
  "it",
  "this",
  "that",
  "some",
  "any",
  "very",
  "really",
  "just",
  "like",
  "would",
  "love",
  "prefer",
  "looking",
  "keyboard",
  "keyboards",
  "switches",
  "switch",
  "typing",
  "type",
  "feel",
  "feeling",
  "feels",
  "sound",
  "sounds",
  "something",
  "kind",
  "sort",
  "키보드",
  "스위치",
  "빌드",
  "타건",
  "타건감",
  "소리",
  "느낌",
  "원해요",
  "원함",
  "원하는",
  "좋은",
  "좋고",
  "그리고",
  "또는",
  "처럼",
  "같은",
  "정도",
  "조금",
  "많이",
  "너무",
  "진짜",
]);

function mergeSparse(into: TraitMetadata, add: TraitMetadata): void {
  for (const k of ENGINE_TRAIT_KEYS) {
    const v = add[k];
    if (typeof v === "number" && !Number.isNaN(v)) {
      into[k] = (into[k] ?? 0) + v;
    }
  }
}

function stripPhrases(normalized: string): { text: string; matched: string[]; phraseBoost: TraitMetadata } {
  let work = ` ${normalized} `;
  const matched: string[] = [];
  const phraseBoost: TraitMetadata = {};

  for (const p of phrasePatternsLongestFirst()) {
    const needle = ` ${p.phrase} `;
    if (work.includes(needle)) {
      matched.push(p.label);
      mergeSparse(phraseBoost, p.boost);
      work = work.split(needle).join(" ");
    }
  }

  return { matched, phraseBoost, text: work.trim() };
}

function tokenPass(text: string): { boost: TraitMetadata; dictTerms: string[]; notes: string[] } {
  const boost: TraitMetadata = {};
  const dictTerms: string[] = [];
  const notes: string[] = [];
  const tokens = text.split(/[^a-z0-9+가-힣]+/i).filter(Boolean);

  for (const raw of tokens) {
    const t = normalizeCommunityTerm(raw);
    if (!t || STOPWORDS.has(t)) continue;
    const candidates = koreanStemCandidates(t);
    let matchedEntry = false;
    for (const c of candidates) {
      const entry = lookupDictionaryEntry(c);
      if (!entry) continue;
      matchedEntry = true;
      dictTerms.push(entry.canonical);
      const sense = pickSense(entry, "highestConfidence");
      mergeSparse(boost, sense.traitBoost);
      notes.push(`${entry.canonical}: ${entry.glossary}`);
      break;
    }
    if (matchedEntry) continue;

    for (const c of candidates) {
      const wb = WORD_BOOSTS[c];
      if (!wb) continue;
      mergeSparse(boost, wb);
      break;
    }
  }

  return { boost, dictTerms, notes };
}

export const simpleNlPreferenceParser: NlPreferenceParser = {
  kind: "rules",

  parse(input: string): NlParseResult {
    const normalized = normalizeCommunityTerm(input.replace(/\s+/g, " "));
    if (!normalized) {
      return {
        traitDelta: {},
        matchedDictionaryTerms: [],
        matchedPhrases: [],
        notes: [],
        method: "rules",
      };
    }

    const { text, matched: matchedPhrases, phraseBoost } = stripPhrases(normalized);
    const { boost: tokenBoost, dictTerms, notes: tokenNotes } = tokenPass(text);

    const combined: TraitMetadata = { ...phraseBoost };
    mergeSparse(combined, tokenBoost);

    return {
      method: "rules",
      matchedDictionaryTerms: [...new Set(dictTerms)],
      matchedPhrases,
      notes: [...new Set(tokenNotes)],
      traitDelta: combined,
    };
  },
};
