/**
 * Keyboard sound & feel terminology → structured internal traits.
 *
 * **Quick start**
 * ```ts
 * import { defaultDictionaryResolver } from "@/keyboard-terminology";
 * const r = defaultDictionaryResolver.resolve("thocky creamy muted");
 * console.log(r.traitDelta, r.beginnerNotes);
 * ```
 *
 * **Architecture (beginner-friendly)**
 * - `dictionary.ts` — community words and their *senses* (multiple meanings).
 * - `indexes.ts` — fast lookup by canonical + alias.
 * - `normalize.ts` — shared string normalization + default tokenizer.
 * - `convert.ts` — sense picking + merging into `TraitMetadata`.
 * - `resolver.ts` — `TerminologyResolver` interface for swapping in NLP later.
 */

export * from "@/keyboard-terminology/types";
export * from "@/keyboard-terminology/dictionary";
export * from "@/keyboard-terminology/normalize";
export * from "@/keyboard-terminology/indexes";
export * from "@/keyboard-terminology/convert";
export * from "@/keyboard-terminology/resolver";
