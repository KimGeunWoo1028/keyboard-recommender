import type { SurveyAnswers } from "@/types/survey";

const SOUND_PROFILE_LABEL: Record<SurveyAnswers["sound_profile"], string> = {
  thocky: "묵직한 저음",
  clacky: "또렷한 고음",
  muted: "차분한 소리",
  balanced: "균형형 사운드",
  bright: "밝은 고음",
};

const VOLUME_LABEL: Record<SurveyAnswers["volume"], string> = {
  quiet: "조용함",
  moderate: "보통 볼륨",
  loud: "큰 소리 OK",
};

const PRESSURE_LABEL: Record<SurveyAnswers["typing_pressure"], string> = {
  light: "가벼운 입력",
  medium: "중간 입력",
  heavy: "묵직한 입력",
};

const SWITCH_FEEL_LABEL: Record<SurveyAnswers["switch_feel"], string> = {
  linear: "매끈한 키감",
  tactile_light: "은은한 구분감",
  tactile_clear: "뚜렷한 구분감",
};

const BOTTOM_OUT_LABEL: Record<SurveyAnswers["bottom_out"], string> = {
  soft: "부드러운 바닥",
  medium: "중간 바닥",
  firm: "단단한 바닥",
};

/** Compact sound preference line for compare cards and secondary surfaces. */
export function soundProfileSummary(answers: SurveyAnswers): string {
  return `${SOUND_PROFILE_LABEL[answers.sound_profile]} · ${VOLUME_LABEL[answers.volume]}`;
}

/** Compact typing preference line for compare cards and secondary surfaces. */
export function typingFeelSummary(answers: SurveyAnswers): string {
  return [
    PRESSURE_LABEL[answers.typing_pressure],
    SWITCH_FEEL_LABEL[answers.switch_feel],
    BOTTOM_OUT_LABEL[answers.bottom_out],
  ].join(" · ");
}
