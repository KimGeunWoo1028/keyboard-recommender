import {
  ENGINE_TRAIT_KEYS,
  expandTraitMetadata,
  type EngineTraitId,
  type EngineTraitVector,
  type TraitMetadata,
} from "@/recommendation-engine/traits";
import { normalizeL2 } from "@/recommendation-engine/vector-math";

const AXIS_LABELS: Record<EngineTraitId, string> = {
  deep_sound: "묵직한 저음 성향",
  clacky: "경쾌하고 또렷한 고음 성향",
  soft: "부드러운 바닥 타건감",
  firm: "단단한 바닥 타건감 (Firm)",
  smooth: "매끈한 키 이동 (Linear)",
  tactile_strength: "구분감 강도 (Tactile)",
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
    return `${first}, ${second}, ${third} 축에서 사용자 성향과 높은 일치도를 보여 추천 점수가 크게 올라갔습니다.`;
  }
  if (second) {
    return `${first}, ${second} 축이 사용자 타건/사운드 성향과 특히 잘 맞습니다.`;
  }
  return `${first} 축이 사용자 타건/사운드 성향과 특히 잘 맞습니다.`;
}
