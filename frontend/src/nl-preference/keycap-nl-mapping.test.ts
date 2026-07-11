import { describe, expect, it } from "vitest";

import { PHRASE_PATTERNS } from "@/nl-preference/phrase-patterns";
import { WORD_BOOSTS } from "@/nl-preference/word-boosts";
import { simpleNlPreferenceParser } from "@/nl-preference/simple-parser";

describe("Phase E keycap NL mapping", () => {
  it("includes keycap material word boosts", () => {
    expect(WORD_BOOSTS.pbt?.soft).toBeGreaterThan(0);
    expect(WORD_BOOSTS.abs?.clacky).toBeGreaterThan(0);
    expect(WORD_BOOSTS["염료승화"]?.soft).toBeGreaterThan(0);
    expect(WORD_BOOSTS["이중사출"]?.clacky).toBeGreaterThan(0);
  });

  it("includes keycap phrase patterns", () => {
    const phrases = PHRASE_PATTERNS.map((p) => p.phrase);
    expect(phrases).toContain("pbt 키캡");
    expect(phrases).toContain("abs 키캡");
    expect(phrases).toContain("염료승화 키캡");
  });

  it("parses PBT keycap preference into soft-leaning traits", () => {
    const result = simpleNlPreferenceParser.parse("조용한 pbt 키캡 원해요");
    expect(result.traitDelta.soft ?? 0).toBeGreaterThan(0);
  });
});
