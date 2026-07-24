/**
 * Honest home preview sample — vocabulary from onboarding style + sample catalog families.
 * Not a live recommendation; must always be labeled 예시 (no fake match %).
 */
export const HOME_RESULT_PREVIEW_EXAMPLE = {
  badge: "예시",
  title: "조용하고 부드러운 방향의 조합",
  tags: ["차분한 소리", "매끈한 입력감", "조용함"] as const,
  parts: [
    { family: "스위치", name: "저소음 리니어" },
    { family: "플레이트", name: "폴리카보네이트" },
    { family: "키캡", name: "PBT" },
  ] as const,
  reason: "소리·타건 취향을 고르면 스위치부터 키캡까지 한 조합으로 이어 줍니다.",
} as const;
