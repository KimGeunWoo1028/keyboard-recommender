/**
 * Confidence / preference-fit labels (Pass 3).
 * Calculation unchanged — presentation only.
 *
 * | Internal signal                         | UI label | Meaning |
 * |-----------------------------------------|----------|---------|
 * | high + stable gap                       | 잘 맞음   | 설문 응답이 일관되고, 후보 간 차이가 분명함 |
 * | balanced / low-confidence / small gap   | 균형형    | 일부 선호가 엇갈리거나 후보가 비슷해 균형 조합을 고름 |
 * | experimental / fallback recovered       | 탐색형    | 결과가 참고용·탐색에 가깝고, 확정 추천으로 보기 어려움 |
 */
export const PREFERENCE_FIT_LABEL = {
  high: "잘 맞음",
  balanced: "균형형",
  exploratory: "탐색형",
} as const;

export type PreferenceFitTier = keyof typeof PREFERENCE_FIT_LABEL;
