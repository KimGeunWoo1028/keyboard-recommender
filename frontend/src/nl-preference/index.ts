/**
 * Natural-language preferences → recommendation-engine traits.
 *
 * - **Rules today**: `simpleNlPreferenceParser` (phrases + terminology + word boosts).
 * - **Tomorrow**: `setNlPreferenceParser(yourModelParser)` — same `NlParseResult` contract.
 */

export * from "@/nl-preference/types";
export * from "@/nl-preference/phrase-patterns";
export * from "@/nl-preference/word-boosts";
export * from "@/nl-preference/simple-parser";
export * from "@/nl-preference/merge-submission";
