"use client";

import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";

import { HelpHint } from "./help-hint";

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
  moderate: "보통 볼륨",
  loud: "큰 편",
};

export function preferenceRowsFromAnswers(answers: SurveySubmission["answers"]) {
  return [
    { label: "소리", value: soundLabelMap[answers.sound_profile] },
    { label: "타건 압력", value: pressureLabelMap[answers.typing_pressure] },
    { label: "타건감", value: switchFeelLabelMap[answers.switch_feel] },
    { label: "바닥감", value: bottomOutLabelMap[answers.bottom_out] },
    { label: "소음", value: volumeLabelMap[answers.volume] },
  ];
}

/** Compact preference tags for first-viewport scan (2–4). */
export function preferenceTagsFromAnswers(answers: SurveySubmission["answers"]): string[] {
  const tags = [
    volumeLabelMap[answers.volume],
    soundLabelMap[answers.sound_profile],
    switchFeelLabelMap[answers.switch_feel],
    bottomOutLabelMap[answers.bottom_out],
  ];
  return [...new Set(tags)].slice(0, 4);
}

export function SharedResultHeader({
  submission,
  showPreferenceDetail = false,
}: {
  submission: SurveySubmission;
  /** Kept for call-site compatibility; title is derived from survey answers. */
  build: RecommendedBuild;
  /** When false, preference rows render later (after CTA) for mobile density. */
  showPreferenceDetail?: boolean;
}) {
  const { answers } = submission;
  const preferenceRows = preferenceRowsFromAnswers(answers);
  const tags = preferenceTagsFromAnswers(answers);

  const preferenceAlignedTitle = `${soundLabelMap[answers.sound_profile]} · ${switchFeelLabelMap[answers.switch_feel]}`;
  const preferenceAlignedSubtitle =
    "설문에서 고른 소리·키감 성향에 맞춰 스위치부터 키캡까지 골랐어요.";

  return (
    <div className="space-y-4 sm:space-y-5">
      <article className="overflow-hidden rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest">
        <div className="space-y-2 px-4 py-5 sm:px-6 sm:py-6">
          <p className="text-sm text-ca-on-surface-variant">추천 결과</p>
          <h2 className="flex flex-wrap items-center gap-2 font-headline text-xl font-semibold tracking-tight text-ca-on-surface sm:text-2xl">
            <span>{preferenceAlignedTitle}</span>
            <HelpHint text="제목은 이번 설문에서 고른 사운드·키감 성향을 그대로 보여 줍니다. 아래 취향 태그와 같아야 해요." />
          </h2>
          <p className="max-w-3xl break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
            {preferenceAlignedSubtitle}
          </p>
          {tags.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="취향 태그">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-md border border-ca-outline-variant/40 px-2 py-0.5 text-xs text-ca-on-surface-variant sm:text-sm"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </article>

      {showPreferenceDetail ? <ResultsPreferenceSummary answers={answers} rows={preferenceRows} /> : null}
    </div>
  );
}

export function ResultsPreferenceSummary({
  answers: _answers,
  rows,
}: {
  answers: SurveySubmission["answers"];
  rows?: ReturnType<typeof preferenceRowsFromAnswers>;
}) {
  const preferenceRows = rows ?? preferenceRowsFromAnswers(_answers);

  return (
    <div data-testid="e2e-preference-summary">
      <details className="group rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container-lowest sm:hidden">
        <summary className="cursor-pointer list-none px-3 py-2.5 [&::-webkit-details-marker]:hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-ca-on-surface">내 취향 요약</span>
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
        <p className="text-sm font-medium text-ca-on-surface">내 취향 요약</p>
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
