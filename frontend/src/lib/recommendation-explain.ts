import {
  ENGINE_TRAIT_KEYS,
  expandTraitMetadata,
  type EngineTraitId,
  type EngineTraitVector,
  type TraitMetadata,
} from "@/recommendation-engine/traits";
import { normalizeL2 } from "@/recommendation-engine/vector-math";

const AXIS_LABELS: Record<EngineTraitId, string> = {
  deep_sound: "묵직한 저음",
  clacky: "또렷한 고음",
  soft: "부드러운 바닥감",
  firm: "단단한 바닥감",
  smooth: "매끈한 타건감",
  tactile_strength: "구분감",
};

/**
 * Short explanation of why a catalog item ranks well for this user vector
 * (contribution = normalized user · expanded item, per axis).
 */
export function explainMatch(userPreference: EngineTraitVector, meta: TraitMetadata): string {
  const u = normalizeL2(userPreference);
  const item = expandTraitMetadata(meta);

  const contributions = ENGINE_TRAIT_KEYS.map((k) => ({
    k,
    c: u[k] * item[k],
  }))
    .filter((x) => x.c > 0.001)
    .sort((a, b) => b.c - a.c)
    .slice(0, 3);

  if (contributions.length === 0) {
    return "전반적으로 고르게 맞는 후보라 상위권에 배치되었습니다. 선호가 넓게 분포한 경우에는 세부 점수와 인기 가중치가 순위를 가를 수 있습니다.";
  }

  const labels = contributions.map(({ k }) => AXIS_LABELS[k]);
  const [first, second, third] = labels;
  if (third) {
    return `${first}, ${second}, ${third} 느낌이 취향과 잘 맞아 추천되었습니다.`;
  }
  if (second) {
    return `${first}, ${second} 느낌이 취향과 특히 잘 맞습니다.`;
  }
  return `${first} 느낌이 취향과 특히 잘 맞습니다.`;
}
