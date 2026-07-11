/**
 * UI-facing trait axis labels and HelpHint copy for /results Evidence.
 * Canonical ids align with catalog + trait_engine axes used in API responses.
 */

export type TraitAxisLabel = {
  /** Korean label shown in UI */
  label: string;
  /** Beginner-facing HelpHint (optional) */
  hint?: string;
};

/** All trait axis ids the Evidence tab may render — QA gate requires 100% coverage. */
export const CANONICAL_TRAIT_AXIS_IDS = [
  "deep_sound",
  "high_pitch",
  "muted",
  "poppy",
  "marbly",
  "smooth",
  "scratchy",
  "soft_bottom_out",
  "firm_bottom_out",
  "flexible",
  "stiff",
  "stiffness",
  "strong_tactile",
  "tactile_strength",
  "light_typing_force",
  "loudness",
  "bounce",
  "clacky",
  "soft",
  "firm",
  "warm",
  "bright",
  "tactile",
  "quiet",
] as const;

export type CanonicalTraitAxisId = (typeof CANONICAL_TRAIT_AXIS_IDS)[number];

const TRAIT_AXIS_LABELS: Record<CanonicalTraitAxisId, TraitAxisLabel> = {
  deep_sound: {
    label: "묵직한 저음 (Thocky)",
    hint: "낮은 주파수·저음이 두툼하게 느껴지는 사운드 성향입니다.",
  },
  high_pitch: {
    label: "또렷한 고음 (Clacky)",
    hint: "어택이 또렷하고 고음이 살아 있는 타건 성향입니다.",
  },
  muted: {
    label: "차분한 감쇠음 (Muted)",
    hint: "고음이 눌리고 전체적으로 차분하게 들리는 성향입니다.",
  },
  poppy: {
    label: "통통 튀는 어택감 (Poppy)",
    hint: "바닥 타건 시 에너지가 통통 튀는 느낌이 강한 성향입니다.",
  },
  marbly: {
    label: "또각거리는 배음 (Marbly)",
    hint: "돌·유리 구슬처럼 단단하고 또각거리는 배음이 느껴지는 성향입니다.",
  },
  smooth: {
    label: "매끈한 타건감 (Smooth)",
    hint: "구분감 없이 매끈하게 눌리는 리니어에 가까운 키감입니다.",
  },
  scratchy: {
    label: "서걱이는 질감 (Scratchy)",
    hint: "스크래치·마찰감이 느껴지는 거친 타건 질감입니다.",
  },
  soft_bottom_out: {
    label: "부드러운 바닥감 (Soft bottom-out)",
    hint: "키가 바닥에 닿을 때 쿠션감이 있고 부드럽게 멈추는 느낌입니다.",
  },
  firm_bottom_out: {
    label: "단단한 바닥감 (Firm bottom-out)",
    hint: "바닥에서 딱 멈추는 단단하고 짧은 피드백입니다.",
  },
  flexible: {
    label: "유연한 키감 (Flex)",
    hint: "플레이트·스택이 유연하게 휘는 느낌이 나는 성향입니다.",
  },
  stiff: {
    label: "단단한 고정감 (Stiff)",
    hint: "휘지 않고 단단하게 받쳐 주는 느낌입니다.",
  },
  stiffness: {
    label: "강성 (Stiffness)",
    hint: "플레이트·케이스 스택이 얼마나 단단한지에 대한 상대 지표입니다.",
  },
  strong_tactile: {
    label: "뚜렷한 구분감 (Strong tactile)",
    hint: "탁타일 범프가 뚜렷하게 느껴지는 키감입니다.",
  },
  tactile_strength: {
    label: "구분감 강도 (Tactile strength)",
    hint: "탁타일 이벤트가 얼마나 강하게 느껴지는지 나타냅니다.",
  },
  light_typing_force: {
    label: "가벼운 입력 압력 (Light force)",
    hint: "가볍게 눌러도 안정적으로 입력되는 압력 성향입니다.",
  },
  loudness: {
    label: "체감 볼륨 (Loudness)",
    hint: "일반적인 빌드에서 얼마나 크게 들리는지에 대한 상대 지표입니다.",
  },
  bounce: {
    label: "리바운드감 (Bounce)",
    hint: "키가 올라올 때 에너지가 살아 있는 정도입니다.",
  },
  clacky: {
    label: "또렷한 고음 (Clacky)",
    hint: "6축 요약 지표 — 고음·어택이 또렷한 성향입니다.",
  },
  soft: {
    label: "부드러운 바닥감 (Soft)",
    hint: "6축 요약 지표 — 부드럽고 쿠션 있는 바닥감입니다.",
  },
  firm: {
    label: "단단한 바닥감 (Firm)",
    hint: "6축 요약 지표 — 단단하고 짧게 멈추는 바닥감입니다.",
  },
  warm: {
    label: "따뜻한 저음 (Warm)",
    hint: "레거시 6축 — 저음이 풍부하고 따뜻하게 들리는 성향입니다.",
  },
  bright: {
    label: "밝은 고음 (Bright)",
    hint: "레거시 6축 — 고음이 밝고 생동감 있게 들리는 성향입니다.",
  },
  tactile: {
    label: "구분감 (Tactile)",
    hint: "레거시 6축 — 탁타일 범프가 느껴지는 키감입니다.",
  },
  quiet: {
    label: "조용한 타건 (Quiet)",
    hint: "레거시 6축 — 상대적으로 조용한 타건 성향입니다.",
  },
};

export function traitAxisDisplayLabel(axis: string): string {
  const key = axis as CanonicalTraitAxisId;
  return TRAIT_AXIS_LABELS[key]?.label ?? axis.replaceAll("_", " ");
}

export function traitAxisHelpHint(axis: string): string | undefined {
  const key = axis as CanonicalTraitAxisId;
  return TRAIT_AXIS_LABELS[key]?.hint;
}

export function isCanonicalTraitAxis(axis: string): axis is CanonicalTraitAxisId {
  return (CANONICAL_TRAIT_AXIS_IDS as readonly string[]).includes(axis);
}

/** Survey accumulator keys → Korean labels for Evidence badges */
const SURVEY_TRAIT_LABELS: Record<string, string> = {
  soundMuted: "차분한 감쇠음",
  soundBright: "밝은 사운드",
  soundThocky: "묵직한 저음",
  soundClacky: "또렷한 고음",
  volumeQuiet: "조용한 볼륨",
  volumeLoud: "큰 볼륨",
  linearLean: "리니어 성향",
  tactileLean: "탁타일 성향",
  softBottom: "부드러운 바닥감",
  firmBottom: "단단한 바닥감",
  lightPress: "가벼운 입력",
  heavyPress: "묵직한 입력",
};

export function surveyTraitDisplayLabel(key: string): string {
  return SURVEY_TRAIT_LABELS[key] ?? key;
}

export const EVIDENCE_STORY_STEPS = [
  {
    id: "profile",
    title: "1단 · 내 취향 이해",
    description: "설문과 서버 계산으로 정리된 성향 프로필입니다. 점수가 클수록 해당 성향이 더 뚜렷합니다.",
  },
  {
    id: "context",
    title: "2단 · 계산 맥락",
    description: "자유 입력·피드백 등 추천 점수에 반영된 추가 맥락입니다.",
  },
  {
    id: "picks",
    title: "3단 · 후보별 추천 근거",
    description: "각 후보가 왜 추천됐는지, 무엇을 참고하면 좋은지 단계별로 확인하세요.",
  },
] as const;

export const PICK_EVIDENCE_STEPS = [
  { id: "summary", label: "① 한줄 요약", hint: "이 후보를 한 문장으로 요약한 설명입니다." },
  { id: "why", label: "② 왜 잘 맞는지", hint: "내 취향과 잘 맞는 축을 중심으로 설명합니다." },
  { id: "caveat", label: "③ 참고할 점", hint: "트레이드오프와 점수에 영향을 준 항목을 확인하세요." },
] as const;
