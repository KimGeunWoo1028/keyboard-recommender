/**
 * Survey copy + per-option trait deltas.
 * Example: choosing "quiet" increases `volumeQuiet` and nudges `soundMuted`
 * (internal mapping only — not shown to the user as raw traits).
 */

import type { SurveyAnswers, SurveyStepId } from "@/types/survey";
import type { TraitAccumulator } from "@/types/traits";

export type SurveyOption<T extends SurveyAnswers[SurveyStepId] = SurveyAnswers[SurveyStepId]> = {
  id: T;
  label: string;
  description: string;
  /** Added to the running trait score when this option is selected */
  traitDelta: Partial<TraitAccumulator>;
};

export type SurveyStepDefinition<T extends SurveyStepId = SurveyStepId> = {
  id: T;
  title: string;
  description: string;
  options: SurveyOption<SurveyAnswers[T]>[];
};

/** Ordered steps — order is the wizard flow */
export const SURVEY_STEPS: readonly SurveyStepDefinition[] = [
  {
    id: "sound_profile",
    title: "선호 사운드 성향",
    description: "단순 볼륨보다, 키를 끝까지 눌렀을 때의 전체 톤을 기준으로 골라주세요.",
    options: [
      {
        id: "thocky",
        label: "묵직한 저음",
        description: "낮은 소리가 둥글고 묵직하게 들리고, 날카로운 느낌은 적은 편이에요.",
        traitDelta: { soundThocky: 3, soundMuted: 1, soundBright: -1 },
      },
      {
        id: "clacky",
        label: "또렷한 고음",
        description: "키를 눌렀을 때 소리가 또렷하고 가볍게 잘 들리는 편이에요.",
        traitDelta: { soundClacky: 3, soundBright: 2, soundMuted: -1 },
      },
      {
        id: "muted",
        label: "차분한 소리",
        description: "울림이 줄고 전체적으로 차분합니다. 기본적으로도 상대적으로 조용한 편이에요.",
        // Phase E: stronger muted signal for PBT / dye-sub keycap ranking alignment
        traitDelta: { soundMuted: 4, volumeQuiet: 2, soundBright: -2 },
      },
      {
        id: "balanced",
        label: "균형형 / 아직 고민 중",
        description: "한쪽으로 치우치지 않은 중간 성향을 원해요.",
        traitDelta: { soundThocky: 1, soundClacky: 1, soundMuted: 1 },
      },
      {
        id: "bright",
        label: "밝고 생동감 있는 고음",
        description: "고음이 살아 있어 생동감 있게 들리고, 기본 세팅에서는 조금 더 크게 느껴질 수 있어요.",
        // Phase E: stronger bright/clacky for ABS doubleshot keycap ranking alignment
        traitDelta: { soundBright: 4, soundClacky: 2, soundMuted: -2 },
      },
    ],
  },
  {
    id: "typing_pressure",
    title: "타건 압력",
    description: "평소 편하게 타이핑할 때 어느 정도 힘으로 누르나요?",
    options: [
      {
        id: "light",
        label: "가볍게 누름",
        description: "끝까지 강하게 누르기보다는 가볍게 입력하는 편이에요.",
        traitDelta: { lightPress: 3, softBottom: 1, firmBottom: -1 },
      },
      {
        id: "medium",
        label: "보통 / 아직 고민 중",
        description: "가볍지도 무겁지도 않은 중간 정도 타건입니다.",
        traitDelta: { lightPress: 1, heavyPress: 1 },
      },
      {
        id: "heavy",
        label: "강하게 누름 / 단단한 감각",
        description: "확실하게 끝까지 누르는 편이고 단단한 바닥감을 선호해요.",
        traitDelta: { heavyPress: 3, firmBottom: 2, softBottom: -1 },
      },
    ],
  },
  {
    id: "switch_feel",
    title: "구분감 있는 키감 vs 매끈한 키감",
    description: "누를 때 걸리는 느낌이 있길 원하나요, 아니면 처음부터 끝까지 부드럽게 내려가길 원하나요?",
    options: [
      {
        id: "tactile_clear",
        label: "구분감이 뚜렷함",
        description: "바닥까지 가기 전에, 중간에 턱이 분명하게 느껴졌으면 좋겠어요.",
        traitDelta: { tactileLean: 3, linearLean: -1 },
      },
      {
        id: "tactile_light",
        label: "구분감이 은은함",
        description: "가벼운 걸림은 좋지만, 너무 강하게 걸리는 느낌은 원하지 않아요.",
        traitDelta: { tactileLean: 2, linearLean: 0 },
      },
      {
        id: "linear",
        label: "매끈한 입력감",
        description: "처음부터 끝까지 매끈하게 내려가는 느낌입니다. 게임·연속 입력에 잘 맞아요.",
        traitDelta: { linearLean: 3, tactileLean: -1 },
      },
    ],
  },
  {
    id: "bottom_out",
    title: "바닥 타건감",
    description: "키를 끝까지 눌렀을 때 부드러운 쿠션감과 단단한 멈춤 중 무엇을 선호하나요?",
    options: [
      {
        id: "soft",
        label: "부드러운 / 쿠션형",
        description: "충격이 덜하고 부드러운 착지감입니다.",
        traitDelta: { softBottom: 3, firmBottom: -1, soundMuted: 1 },
      },
      {
        id: "medium",
        label: "중간 / 아직 고민 중",
        description: "너무 물렁하지도 너무 단단하지도 않은 중간 바닥감입니다.",
        traitDelta: { softBottom: 1, firmBottom: 1 },
      },
      {
        id: "firm",
        label: "단단한 바닥감",
        description: "확실하고 또렷한 바닥감을 선호해요.",
        traitDelta: { firmBottom: 3, softBottom: -1, soundBright: 1 },
      },
    ],
  },
  {
    id: "volume",
    title: "소음 민감도",
    description: "사용 환경에서 소음을 줄이는 것이 얼마나 중요한가요?",
    options: [
      {
        id: "quiet",
        label: "가능한 조용하게",
        description: "공유 공간/회의/야간 사용이 많아 최대한 조용했으면 해요.",
        traitDelta: { volumeQuiet: 3, soundMuted: 2, soundBright: -1 },
      },
      {
        id: "moderate",
        label: "보통 / 아직 고민 중",
        description: "일반 기계식 키보드 수준의 소리는 괜찮아요.",
        traitDelta: { volumeQuiet: 1, volumeLoud: 1 },
      },
      {
        id: "loud",
        label: "큰 소리도 괜찮음",
        description: "타건음 피드백을 즐기며 소음을 크게 신경 쓰지 않아요.",
        traitDelta: { volumeLoud: 3, soundBright: 1, soundMuted: -1 },
      },
    ],
  },
] as const satisfies readonly SurveyStepDefinition[];

export const SURVEY_STEP_ORDER: SurveyStepId[] = SURVEY_STEPS.map((s) => s.id);
