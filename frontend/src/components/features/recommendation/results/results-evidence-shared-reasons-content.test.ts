import { describe, expect, it } from "vitest";

import type { ApiPick } from "./results-evidence-types";
import {
  deriveSharedEvidenceReasons,
  formatEvidenceCardWhyLine,
} from "./results-evidence-shared-reasons-content";

const ALIGNMENT_TRAIT =
  "차분한 소리 선호(+8.0)와 후보 특성(+10.0)이 같은 방향이라 정합 기여가 큽니다(+84.0).";

const TRADEOFF_TRAIT =
  "구분감 있는 키감 축은 트레이드오프가 있습니다. 이 축의 가중 일치도가 상대적으로 낮아(-7.0), 핵심 선호 축 대비 체감이 덜 맞을 수 있습니다.";

function pick(domain: string, whyTraits: string[] = [], tradeOffs: string[] = []): ApiPick {
  return {
    domain,
    itemId: `${domain}-1`,
    itemName: `${domain} item`,
    score: 0.8,
    explanation: "",
    summary: `${domain} summary`,
    whyTraits,
    tradeOffs,
  };
}

describe("deriveSharedEvidenceReasons", () => {
  it("lifts axes repeated across most picks to shared bullets", () => {
    const apiPicks = [
      pick("switch", [ALIGNMENT_TRAIT, "저소음 무소음 스위치입니다."]),
      pick("plate", [ALIGNMENT_TRAIT, "FR4 소재 플레이트입니다."]),
      pick("foam", [ALIGNMENT_TRAIT]),
      pick("layout", [ALIGNMENT_TRAIT]),
      pick("case", [ALIGNMENT_TRAIT]),
      pick("keycap", [ALIGNMENT_TRAIT]),
    ];

    const shared = deriveSharedEvidenceReasons(apiPicks);
    expect(shared.hasSharedReasons).toBe(true);
    expect(shared.alignmentBullets).toContain("차분한 소리 취향과 일치");
  });

  it("lifts repeated tradeoffs to shared caution", () => {
    const apiPicks = [
      pick("switch", [], [TRADEOFF_TRAIT]),
      pick("plate", [], [TRADEOFF_TRAIT]),
      pick("foam", [], [TRADEOFF_TRAIT]),
      pick("layout", [], [TRADEOFF_TRAIT]),
      pick("case", [], [TRADEOFF_TRAIT]),
    ];

    const shared = deriveSharedEvidenceReasons(apiPicks);
    expect(shared.tradeoffLine).toBe("구분감 있는 키감 쪽은 상대적으로 덜 맞습니다.");
  });

  it("returns no shared block for a single pick", () => {
    const shared = deriveSharedEvidenceReasons([pick("switch", [ALIGNMENT_TRAIT])]);
    expect(shared.hasSharedReasons).toBe(false);
  });
});

describe("formatEvidenceCardWhyLine", () => {
  it("uses part-specific label and feel hook when shared reasons exist", () => {
    const shared = deriveSharedEvidenceReasons([
      pick("switch", [ALIGNMENT_TRAIT, "저소음 무소음 스위치입니다."]),
      pick("plate", [ALIGNMENT_TRAIT, "FR4 소재 플레이트입니다."]),
      pick("foam", [ALIGNMENT_TRAIT]),
      pick("layout", [ALIGNMENT_TRAIT]),
    ]);

    const switchCard = formatEvidenceCardWhyLine(
      pick("switch", [ALIGNMENT_TRAIT, "저소음 무소음 스위치입니다."]),
      shared,
    );
    const plateCard = formatEvidenceCardWhyLine(
      pick("plate", [ALIGNMENT_TRAIT, "FR4 소재 플레이트입니다."]),
      shared,
    );
    const foamCard = formatEvidenceCardWhyLine(pick("foam", [ALIGNMENT_TRAIT]), shared);

    expect(switchCard.label).toBe("부품별 근거");
    expect(switchCard.line).toBe("저소음 환경에 무난한 스위치예요.");
    expect(plateCard.line).toBe("FR4로 타건 강성과 소리 톤을 잡아줘요.");
    expect(foamCard.line).toBe("울림을 줄이거나 다듬어 줘요.");
    expect(switchCard.line).not.toEqual(plateCard.line);
    expect(switchCard.line).not.toContain("차분한 소리");
  });

  it("keeps legacy why label when shared block is absent", () => {
    const shared = deriveSharedEvidenceReasons([]);
    const card = formatEvidenceCardWhyLine(
      pick("plate", ["FR4 소재입니다."], []),
      shared,
    );

    expect(card.label).toBe("왜 추천했나요");
    expect(card.line).toContain("플레이트");
  });
});
