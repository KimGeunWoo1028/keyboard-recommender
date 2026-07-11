import { describe, expect, it } from "vitest";

import {
  formatEvidenceDetailLines,
  formatEvidenceTradeoff,
  formatEvidenceWhyLine,
  isEvidenceEngineAuditLine,
  isGenericBuildPartDescription,
  overviewAlternativeDescription,
  overviewBuildPartDescription,
} from "./results-text-utils";

describe("overviewAlternativeDescription", () => {
  it("prefers catalog description when present", () => {
    expect(
      overviewAlternativeDescription(
        "가벼운 스프링 42g, 무소음 리니어",
        "ignored summary",
        "Cherry MX",
      ),
    ).toBe("가벼운 스프링 42g, 무소음 리니어");
  });

  it("extracts product spec sentence from engine summary", () => {
    expect(
      overviewAlternativeDescription(
        undefined,
        "체리 MX2A 클래식 히로세 키보드 스위치은(는) 가벼운 스프링(42g) 설정입니다. 그리고 차분한 감쇠음 · 푹신한 바닥감 성향 정합이 높아 상위 추천되었습니다.",
        "체리 MX2A 클래식 히로세 키보드 스위치",
      ),
    ).toBe("가벼운 스프링(42g) 설정입니다.");
  });

  it("returns empty when summary is only recommendation rationale", () => {
    expect(
      overviewAlternativeDescription(
        undefined,
        "단일 축보다 전체 균형 점수가 높아 추천되었습니다.",
      ),
    ).toBe("");
  });

  it("formatEvidenceWhyLine uses short feel hook and keeps specs for product features", () => {
    const whyTraits = [
      "중간 무게의 스프링(44g) 설정입니다.",
      "팩토리 윤활이 적용되어 마찰감을 줄인 세팅입니다.",
      "차분한 감쇠음 선호(+8.0)와 후보 특성(+10.0)이 같은 방향이라 정합 기여가 큽니다(+84.0).",
      "매끈한 타건감 선호(+5.0)와 후보 특성(+9.2)이 같은 방향이라 정합 기여가 큽니다(+55.2).",
    ];
    const why = formatEvidenceWhyLine("ignored", whyTraits, "Switch", "switch");
    expect(why).toBe("차분한 감쇠음 취향에 맞게, 차분한 소리 톤을 내기 좋아요.");
    expect(formatEvidenceDetailLines(whyTraits, why)).toEqual([
      "중간 무게의 스프링(44g) 설정입니다.",
      "팩토리 윤활이 적용되어 마찰감을 줄인 세팅입니다.",
    ]);
  });

  it("formatEvidenceWhyLine infers tactile switch hook from spec traits", () => {
    expect(
      formatEvidenceWhyLine(
        "ignored",
        [
          "중간 무게의 스프링(47g) 설정입니다.",
          "저소음 택타일 스위치입니다.",
          "차분한 감쇠음 선호(+8.0)와 후보 특성(+10.0)이 같은 방향이라 정합 기여가 큽니다(+84.0).",
        ],
        "TTC Switch",
        "switch",
      ),
    ).toBe("차분한 감쇠음 취향에 맞게, 촉각이 살아 있는 택타일 스위치예요.");
  });

  it("formatEvidenceWhyLine prefers domain-relevant axis for plates", () => {
    const whyTraits = [
      "FR4 소재 플레이트입니다.",
      "플렉스 강도는 7/10 수준입니다.",
      "차분한 감쇠음 선호(+8.0)와 후보 특성(+10.0)이 같은 방향이라 정합 기여가 큽니다(+84.0).",
      "푹신한 바닥감 선호(+6.0)와 후보 특성(+8.0)이 같은 방향이라 정합 기여가 큽니다(+40.0).",
    ];
    const why = formatEvidenceWhyLine(
      "Qwertykeys QK65 MK3 보강판은(는) FR4 소재 플레이트입니다.",
      whyTraits,
      "Qwertykeys QK65 MK3 보강판",
      "plate",
    );
    expect(why).toBe("푹신한 바닥감 취향에 맞게, 부드러운 바닥감을 살려줘요.");
    expect(formatEvidenceDetailLines(whyTraits, why)).toEqual([
      "FR4 소재 플레이트입니다.",
      "플렉스 강도는 7/10 수준입니다.",
    ]);
  });

  it("formatEvidenceTradeoff humanizes compromise axis and skips alt lines", () => {
    expect(
      formatEvidenceTradeoff([
        "대안 WEKT Kunzite 쿤자이트 저소음 리니어 스위치은(는) 푹신한 바닥감 측면을 더 보완하지만, 차분한 감쇠음 축 정합성이 낮아 전체 순위는 현재 후보가 앞섰습니다.",
        "구분감 있는 키감 축은 타협이 있습니다. 선호(-2.0) 대비 후보 특성(+2.6)이 어긋나 기여가 낮아집니다(-7.0).",
      ]),
    ).toBe("구분감 있는 키감 쪽은 상대적으로 덜 맞습니다.");
    expect(formatEvidenceTradeoff([])).toBeNull();
    expect(formatEvidenceTradeoff(undefined)).toBeNull();
  });

  it("keeps specific catalog description for build parts", () => {
    expect(
      overviewBuildPartDescription(
        "입력이 매끈하고 반응이 빨라, 부드러운 타건감과 안정적인 복귀감을 원하는 사용자에게 잘 맞는 타입입니다.",
        "ignored",
        "HMX Peach",
      ),
    ).toBe("입력이 매끈하고 반응이 빨라, 부드러운 타건감과 안정적인 복귀감을 원하는 사용자에게 잘 맞는 타입입니다.");
  });

  it("replaces generic plate description with spec line from summary", () => {
    const generic =
      "보강판 특성에 따라 타건 강성, 소리 성향, 바닥감이 달라지므로 사용 취향에 맞춰 조정하는 핵심 요소입니다.";
    expect(isGenericBuildPartDescription(generic)).toBe(true);
    expect(
      overviewBuildPartDescription(
        generic,
        "Qwertykeys QK65 MK3 보강판은(는) FR4 소재 플레이트입니다. 그리고 푹신한 바닥감 · 차분한 감쇠음 성향 정합이 높아 상위 추천되었습니다.",
        "Qwertykeys QK65 MK3 보강판",
      ),
    ).toBe("FR4 소재 플레이트입니다.");
  });
});

describe("formatEvidenceDetailLines", () => {
  const STABLE_SWITCH_TRAITS = [
    "중간 무게의 스프링(44g) 설정입니다.",
    "팩토리 윤활이 적용되어 마찰감을 줄인 세팅입니다.",
    "차분한 감쇠음 선호(+8.0)와 후보 특성(+10.0)이 같은 방향이라 정합 기여가 큽니다(+84.0).",
    "매끈한 타건감 선호(+5.0)와 후보 특성(+9.2)이 같은 방향이라 정합 기여가 큽니다(+55.2).",
  ];

  it("keeps product spec lines and drops engine audit traits", () => {
    expect(formatEvidenceDetailLines(STABLE_SWITCH_TRAITS)).toEqual([
      "중간 무게의 스프링(44g) 설정입니다.",
      "팩토리 윤활이 적용되어 마찰감을 줄인 세팅입니다.",
    ]);
  });

  it("returns empty when only engine audit lines exist", () => {
    expect(
      formatEvidenceDetailLines([
        "차분한 감쇠음 선호(+8.0)와 후보 특성(+10.0)이 같은 방향이라 정합 기여가 큽니다(+84.0).",
      ]),
    ).toEqual([]);
    expect(isEvidenceEngineAuditLine("축에서 사용자 성향(+5)과 잘 맞아")).toBe(true);
  });

  it("limits to three spec lines", () => {
    expect(
      formatEvidenceDetailLines([
        "첫 번째 스펙입니다.",
        "두 번째 스펙입니다.",
        "세 번째 스펙입니다.",
        "네 번째 스펙입니다.",
      ]),
    ).toHaveLength(3);
  });

  it("dedupes lines already shown in why line", () => {
    expect(
      formatEvidenceDetailLines(
        ["FR4 소재입니다.", "추가 스펙 한 줄입니다."],
        "FR4 소재입니다.",
      ),
    ).toEqual(["추가 스펙 한 줄입니다."]);
  });
});
