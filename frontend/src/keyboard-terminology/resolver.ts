/**
 * Resolver implementations — same interface for dictionary lookup and future NLP.
 */

import { communityTextToTraits, type ResolveOptions } from "@/keyboard-terminology/convert";
import type { TerminologyResolver, TermResolution } from "@/keyboard-terminology/types";

/** Today’s resolver: keyword + alias index + simple tokenization. */
export class DictionaryTerminologyResolver implements TerminologyResolver {
  readonly kind = "dictionary" as const;

  constructor(private readonly options: Partial<ResolveOptions> = {}) {}

  resolve(input: string): TermResolution {
    return communityTextToTraits(input, this.options);
  }
}

/**
 * Placeholder for an NLP-backed resolver (embeddings, NER on reviews, etc.).
 * Drop in a real implementation without changing consumers of `TerminologyResolver`.
 */
export class NlpTerminologyResolver implements TerminologyResolver {
  readonly kind = "nlp" as const;

  resolve(_input: string): TermResolution {
    throw new Error(
      "NlpTerminologyResolver is a stub. Wire a model or service here, then map outputs to TermResolution.",
    );
  }
}

/** Default singleton for app code that doesn’t need custom strategies. */
export const defaultDictionaryResolver = new DictionaryTerminologyResolver({
  sensePick: "highestConfidence",
  tokenMerge: "sum",
});
