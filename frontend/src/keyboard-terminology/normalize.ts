/**
 * Normalize community text for dictionary lookup.
 * NLP pipelines can replace tokenization later; normalization stays shared.
 */

/** Lowercase, trim, collapse internal whitespace (beginner-safe, predictable). */
export function normalizeCommunityTerm(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Very small tokenizer: good for keyword lists and manual tags.
 * **NLP expansion:** replace with a `Tokenizer` that returns linguistically meaningful tokens.
 */
export function defaultTokenize(input: string): string[] {
  return input
    .split(/[^a-z0-9+가-힣]+/i)
    .map((t) => normalizeCommunityTerm(t))
    .filter(Boolean);
}

const KOREAN_SUFFIXES = [
  "하고",
  "하게",
  "한데",
  "한",
  "스럽게",
  "스러운",
  "스럽다",
  "느낌",
  "느낌의",
  "성향",
  "타건감",
  "타건",
  "소리",
  "스타일",
] as const;

/** Returns token + lightweight Korean stem candidates for robust dictionary lookup. */
export function koreanStemCandidates(token: string): string[] {
  const t = normalizeCommunityTerm(token);
  if (!t) return [];
  const out = new Set<string>([t]);
  for (const suffix of KOREAN_SUFFIXES) {
    if (t.endsWith(suffix) && t.length > suffix.length + 1) {
      out.add(t.slice(0, -suffix.length));
    }
  }
  return [...out];
}
