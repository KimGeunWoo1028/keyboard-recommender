/**
 * UI-facing trait axis labels and HelpHint copy for /results Evidence.
 * Canonical ids align with catalog + trait_engine axes used in API responses.
 * User-facing copy is Korean-only (no English parentheticals / jargon by default).
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
    label: "묵직한 저음",
    hint: "낮은 소리가 두툼하고 묵직하게 들립니다.",
  },
  high_pitch: {
    label: "또렷한 고음",
    hint: "소리가 가볍고 또렷하게 잘 들립니다.",
  },
  muted: {
    label: "차분한 소리",
    hint: "날카로운 느낌이 줄고 전체적으로 차분하게 들립니다.",
  },
  poppy: {
    label: "통통 튀는 느낌",
    hint: "키를 눌렀을 때 에너지가 통통 되돌아오는 느낌이 납니다.",
  },
  marbly: {
    label: "또각거리는 소리",
    hint: "단단하고 또각거리는 소리가 또렷하게 납니다.",
  },
  smooth: {
    label: "매끈한 타건감",
    hint: "중간에 걸리는 느낌 없이 처음부터 끝까지 매끈하게 눌립니다.",
  },
  scratchy: {
    label: "서걱이는 질감",
    hint: "키를 누를 때 살짝 거친 마찰감이 느껴집니다.",
  },
  soft_bottom_out: {
    label: "부드러운 바닥감",
    hint: "키가 바닥에 닿을 때 쿠션처럼 부드럽게 멈춥니다.",
  },
  firm_bottom_out: {
    label: "단단한 바닥감",
    hint: "키가 바닥에서 짧고 단단하게 딱 멈춥니다.",
  },
  flexible: {
    label: "유연한 키감",
    hint: "누르는 힘이 들어가며 보드가 살짝 휘는 느낌이 납니다.",
  },
  stiff: {
    label: "단단한 고정감",
    hint: "거의 휘지 않고 단단하게 받쳐 주는 느낌입니다.",
  },
  stiffness: {
    label: "보드 단단함",
    hint: "플레이트·케이스가 얼마나 단단하게 받쳐 주는지를 나타냅니다.",
  },
  strong_tactile: {
    label: "뚜렷한 구분감",
    hint: "키를 누르는 중간에 턱이 분명하게 느껴집니다.",
  },
  tactile_strength: {
    label: "구분감 강도",
    hint: "중간에 걸리는 느낌이 얼마나 강한지를 나타냅니다.",
  },
  light_typing_force: {
    label: "가벼운 입력",
    hint: "가볍게 눌러도 편하게 입력이 됩니다.",
  },
  loudness: {
    label: "체감 볼륨",
    hint: "일반적인 사용에서 얼마나 크게 들리는지를 나타냅니다.",
  },
  bounce: {
    label: "되돌아오는 느낌",
    hint: "키가 올라올 때 에너지가 살아 있는 정도입니다.",
  },
  clacky: {
    label: "또렷한 고음",
    hint: "고음이 또렷하고 경쾌하게 들리는 성향입니다.",
  },
  soft: {
    label: "부드러운 바닥감",
    hint: "부드럽고 쿠션 있는 바닥감입니다.",
  },
  firm: {
    label: "단단한 바닥감",
    hint: "단단하고 짧게 멈추는 바닥감입니다.",
  },
  warm: {
    label: "따뜻한 저음",
    hint: "저음이 풍부하고 따뜻하게 들리는 성향입니다.",
  },
  bright: {
    label: "밝은 고음",
    hint: "고음이 밝고 생동감 있게 들리는 성향입니다.",
  },
  tactile: {
    label: "구분감",
    hint: "키를 누르는 중간에 걸리는 느낌이 있는 키감입니다.",
  },
  quiet: {
    label: "조용한 타건",
    hint: "상대적으로 조용하게 들리는 타건 성향입니다.",
  },
};

export function traitAxisDisplayLabel(axis: string): string {
  const key = axis as CanonicalTraitAxisId;
  return TRAIT_AXIS_LABELS[key]?.label ?? "기타 성향";
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
  soundMuted: "차분한 소리",
  soundBright: "밝은 사운드",
  soundThocky: "묵직한 저음",
  soundClacky: "또렷한 고음",
  volumeQuiet: "조용한 볼륨",
  volumeLoud: "큰 볼륨",
  linearLean: "매끈한 키감",
  tactileLean: "구분감 있는 키감",
  softBottom: "부드러운 바닥감",
  firmBottom: "단단한 바닥감",
  lightPress: "가벼운 입력",
  heavyPress: "묵직한 입력",
};

export function surveyTraitDisplayLabel(key: string): string {
  return SURVEY_TRAIT_LABELS[key] ?? "기타 성향";
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
