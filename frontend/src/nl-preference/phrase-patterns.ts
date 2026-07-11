/**
 * Multi-word patterns matched **longest first** so "soft bottom out" wins over "bottom out".
 *
 * Design: keep this list small and explicit — easy to audit. Rich community vocabulary
 * stays in `keyboard-terminology`; this file only covers phrases that don’t decompose cleanly
 * into single dictionary tokens.
 */

import type { TraitMetadata } from "@/recommendation-engine/traits";

export type PhrasePattern = {
  /** Lowercase substring match on normalized text (spaces collapsed). */
  phrase: string;
  /** Short label for `matchedPhrases` in parse results. */
  label: string;
  boost: TraitMetadata;
};

export const PHRASE_PATTERNS: PhrasePattern[] = [
  {
    phrase: "soft bottom out",
    label: "soft bottom-out",
    boost: { soft: 8, firm: -1, deep_sound: 2 },
  },
  {
    phrase: "soft bottom",
    label: "soft bottom",
    boost: { soft: 6, firm: -1 },
  },
  {
    phrase: "hard bottom",
    label: "firm bottom-out",
    boost: { firm: 7, soft: -1, clacky: 3 },
  },
  {
    phrase: "bottom out",
    label: "bottom-out (generic)",
    boost: { soft: 2, firm: 2 },
  },
  {
    phrase: "deep sound",
    label: "deep sound",
    boost: { deep_sound: 6, clacky: 1 },
  },
  {
    phrase: "부드러운 바닥감",
    label: "부드러운 바닥감",
    boost: { soft: 8, firm: -1, deep_sound: 2 },
  },
  {
    phrase: "단단한 바닥감",
    label: "단단한 바닥감",
    boost: { firm: 8, soft: -1, clacky: 2 },
  },
  {
    phrase: "묵직한 저음",
    label: "묵직한 저음",
    boost: { deep_sound: 8, soft: 2, clacky: -1 },
  },
  {
    phrase: "경쾌한 고음",
    label: "경쾌한 고음",
    boost: { clacky: 8, deep_sound: 1, firm: 2 },
  },
  {
    phrase: "도각도각한 느낌",
    label: "도각도각한 느낌",
    boost: { deep_sound: 7, firm: 2, soft: 2 },
  },
  {
    phrase: "보글보글한 느낌",
    label: "보글보글한 느낌",
    boost: { soft: 7, smooth: 4, clacky: -2 },
  },
  {
    phrase: "서걱서걱한 느낌",
    label: "서걱서걱한 느낌",
    boost: { smooth: -3, tactile_strength: 4, clacky: 3 },
  },
  {
    phrase: "조용한 타건감",
    label: "조용한 타건감",
    boost: { soft: 6, clacky: -3, deep_sound: 2 },
  },
  {
    phrase: "저소음 세팅",
    label: "저소음 세팅",
    boost: { soft: 6, clacky: -3, smooth: 2 },
  },
  {
    phrase: "매끈한 리니어",
    label: "매끈한 리니어",
    boost: { smooth: 8, tactile_strength: -2, soft: 2 },
  },
  {
    phrase: "강한 구분감",
    label: "강한 구분감",
    boost: { tactile_strength: 8, firm: 3, smooth: -2 },
  },
  {
    phrase: "가벼운 키압",
    label: "가벼운 키압",
    boost: { soft: 3, smooth: 3, firm: -1, tactile_strength: -1 },
  },
  {
    phrase: "단단한 하우징",
    label: "단단한 하우징",
    boost: { firm: 7, soft: -2, clacky: 2 },
  },
  {
    phrase: "유연한 플렉스",
    label: "유연한 플렉스",
    boost: { soft: 5, smooth: 3, firm: -2 },
  },
  {
    phrase: "통울림 적은",
    label: "통울림 적은",
    boost: { soft: 3, clacky: -2, deep_sound: 2 },
  },
  {
    phrase: "통울림 있는",
    label: "통울림 있는",
    boost: { clacky: 3, deep_sound: 2, soft: -1 },
  },
  {
    phrase: "low pitch",
    label: "low pitch",
    boost: { deep_sound: 5, clacky: 1 },
  },
  // Phase E — keycap preference phrases
  {
    phrase: "pbt 키캡",
    label: "PBT 키캡",
    boost: { soft: 6, clacky: -3, deep_sound: 3 },
  },
  {
    phrase: "abs 키캡",
    label: "ABS 키캡",
    boost: { clacky: 6, soft: -2, firm: 1 },
  },
  {
    phrase: "조용한 키캡",
    label: "조용한 키캡",
    boost: { soft: 6, clacky: -3, deep_sound: 2 },
  },
  {
    phrase: "쨍한 키캡",
    label: "쨍한 키캡",
    boost: { clacky: 6, soft: -2 },
  },
  {
    phrase: "염료승화 키캡",
    label: "염료승화 키캡",
    boost: { soft: 5, clacky: -2, deep_sound: 2 },
  },
  {
    phrase: "이중사출 키캡",
    label: "이중사출 키캡",
    boost: { clacky: 5, soft: -1 },
  },
];

/** Longest phrase first — greedy single-pass stripping avoids partial double-counts. */
export function phrasePatternsLongestFirst(): PhrasePattern[] {
  return [...PHRASE_PATTERNS].sort((a, b) => b.phrase.length - a.phrase.length);
}
