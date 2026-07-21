"use client";

import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";

import { HelpHint } from "./help-hint";

export function SharedResultHeader({
  submission,
}: {
  submission: SurveySubmission;
  /** Kept for call-site compatibility; title is derived from survey answers. */
  build: RecommendedBuild;
}) {
  const { answers } = submission;
  const soundLabelMap: Record<SurveySubmission["answers"]["sound_profile"], string> = {
    thocky: "묵직한 저음",
    clacky: "또렷한 고음",
    muted: "차분한 소리",
    balanced: "균형형 사운드",
    bright: "밝고 생동감 있는 고음",
  };
  const pressureLabelMap: Record<SurveySubmission["answers"]["typing_pressure"], string> = {
    light: "가벼운 입력",
    medium: "중간 입력",
    heavy: "묵직한 입력",
  };
  const switchFeelLabelMap: Record<SurveySubmission["answers"]["switch_feel"], string> = {
    linear: "매끈한 키감",
    tactile_light: "은은한 구분감",
    tactile_clear: "뚜렷한 구분감",
  };
  const bottomOutLabelMap: Record<SurveySubmission["answers"]["bottom_out"], string> = {
    soft: "부드러운 바닥감",
    medium: "중간 바닥감",
    firm: "단단한 바닥감",
  };
  const volumeLabelMap: Record<SurveySubmission["answers"]["volume"], string> = {
    quiet: "조용한 편",
    moderate: "보통",
    loud: "큰 편",
  };

  const preferenceRows = [
    { label: "사운드", value: soundLabelMap[answers.sound_profile] },
    { label: "입력 강도", value: pressureLabelMap[answers.typing_pressure] },
    { label: "스위치 키감", value: switchFeelLabelMap[answers.switch_feel] },
    { label: "바닥 타건감", value: bottomOutLabelMap[answers.bottom_out] },
    { label: "볼륨", value: volumeLabelMap[answers.volume] },
  ];

  // Display title follows survey answers (UX trust) — engine build.title may differ.
  const preferenceAlignedTitle = `${soundLabelMap[answers.sound_profile]} · ${switchFeelLabelMap[answers.switch_feel]}`;
  const preferenceAlignedSubtitle =
    "설문에서 고른 소리·키감 성향에 맞춰 스위치부터 키캡까지 골랐어요.";

  return (
    <div className="space-y-5 sm:space-y-6">
      <article className="overflow-hidden rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest">
        <div className="space-y-2 px-4 py-5 sm:px-6 sm:py-6">
          <p className="text-sm text-ca-on-surface-variant">추천 조합</p>
          <h2 className="flex flex-wrap items-center gap-2 font-headline text-xl font-semibold tracking-tight text-ca-on-surface sm:text-2xl">
            <span>{preferenceAlignedTitle}</span>
            <HelpHint text="제목은 이번 설문에서 고른 사운드·키감 성향을 그대로 보여 줍니다. 아래 ‘내 설문 취향’과 같아야 해요." />
          </h2>
          <p className="max-w-3xl break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
            {preferenceAlignedSubtitle}
          </p>
        </div>
      </article>

      <details className="group rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container-lowest sm:hidden">
        <summary className="cursor-pointer list-none px-3 py-2.5 [&::-webkit-details-marker]:hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-ca-on-surface">내 설문 취향</span>
            <span className="text-xs text-ca-on-surface-variant group-open:hidden">펼치기</span>
            <span className="hidden text-xs text-ca-on-surface-variant group-open:inline">접기</span>
          </div>
        </summary>
        <ul className="space-y-2 border-t border-ca-outline-variant/35 px-3 py-3 text-sm">
          {preferenceRows.map((b) => (
            <li key={b.label} className="flex justify-between gap-3">
              <span className="text-ca-on-surface-variant">{b.label}</span>
              <span className="font-medium text-ca-on-surface">{b.value}</span>
            </li>
          ))}
        </ul>
      </details>

      <div className="hidden sm:block">
        <p className="text-sm font-medium text-ca-on-surface">내 설문 취향</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {preferenceRows.map((b) => (
            <li
              key={b.label}
              className="flex items-baseline justify-between gap-3 border-b border-ca-outline-variant/30 pb-2 text-sm"
            >
              <span className="text-ca-on-surface-variant">{b.label}</span>
              <span className="font-medium text-ca-on-surface">{b.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
