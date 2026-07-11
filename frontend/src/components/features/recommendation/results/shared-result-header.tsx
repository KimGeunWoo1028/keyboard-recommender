"use client";

import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";

import { HelpHint } from "./help-hint";

function splitTaglineBeforeParen(tagline: string): { head: string; tail: string | null } {
  const idx = tagline.indexOf(" (");
  if (idx === -1) return { head: tagline, tail: null };
  return {
    head: tagline.slice(0, idx).trimEnd(),
    tail: tagline.slice(idx + 1).trim(),
  };
}

export function SharedResultHeader({
  submission,
  build,
}: {
  submission: SurveySubmission;
  build: RecommendedBuild;
}) {
  const { answers } = submission;
  const { head: taglineHead, tail: taglineTail } = splitTaglineBeforeParen(build.tagline);
  const soundLabelMap: Record<SurveySubmission["answers"]["sound_profile"], string> = {
    thocky: "묵직한 저음 (Thocky)",
    clacky: "또렷한 고음 (Clacky)",
    muted: "차분한 감쇠음 (Muted)",
    balanced: "균형형 사운드",
    bright: "밝고 생동감 있는 고음 (Bright)",
  };
  const pressureLabelMap: Record<SurveySubmission["answers"]["typing_pressure"], string> = {
    light: "가벼운 입력",
    medium: "중간 입력",
    heavy: "묵직한 입력",
  };
  const switchFeelLabelMap: Record<SurveySubmission["answers"]["switch_feel"], string> = {
    linear: "매끈한 키감 (Linear)",
    tactile_light: "은은한 구분감 (Light tactile)",
    tactile_clear: "뚜렷한 구분감 (Strong tactile)",
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

  return (
    <div className="space-y-3 sm:space-y-5">
      <div>
        <p className="font-label text-[10px] font-semibold text-ca-secondary sm:text-ca-label-sm">RECOMMENDED BUILDS</p>
        <h2 className="font-headline text-lg text-ca-on-surface sm:text-ca-headline-md lg:text-ca-headline-lg">
          정밀 추천 빌드
        </h2>
        <p className="mt-0.5 hidden max-w-2xl text-sm text-ca-on-surface-variant sm:mt-1 sm:block">
          설문·선호를 반영한 6축 조합입니다. 구성품별로 스웨그키에서 바로 확인할 수 있어요.
        </p>
      </div>

      <details className="group rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container/30 sm:hidden">
        <summary className="cursor-pointer list-none px-3 py-2.5 [&::-webkit-details-marker]:hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-ca-on-surface">내 설문 취향 요약</span>
            <span className="text-xs text-ca-on-surface-variant group-open:hidden">펼치기</span>
            <span className="hidden text-xs text-ca-on-surface-variant group-open:inline">접기</span>
          </div>
        </summary>
        <div className="flex flex-wrap gap-2 border-t border-ca-outline-variant/30 p-3">
          {[
            { label: "사운드", value: soundLabelMap[answers.sound_profile] },
            { label: "입력 강도", value: pressureLabelMap[answers.typing_pressure] },
            { label: "스위치 키감", value: switchFeelLabelMap[answers.switch_feel] },
            { label: "바닥 타건감", value: bottomOutLabelMap[answers.bottom_out] },
            { label: "볼륨", value: volumeLabelMap[answers.volume] },
          ].map((b) => (
            <span key={b.label} className="ca-chip">
              {b.label}: {b.value}
            </span>
          ))}
        </div>
      </details>

      <div className="hidden flex-wrap gap-2 sm:flex">
        {[
          { label: "사운드", value: soundLabelMap[answers.sound_profile] },
          { label: "입력 강도", value: pressureLabelMap[answers.typing_pressure] },
          { label: "스위치 키감", value: switchFeelLabelMap[answers.switch_feel] },
          { label: "바닥 타건감", value: bottomOutLabelMap[answers.bottom_out] },
          { label: "볼륨", value: volumeLabelMap[answers.volume] },
        ].map((b) => (
          <span key={b.label} className="ca-chip">
            {b.label}: {b.value}
          </span>
        ))}
      </div>

      <article className="ca-glass-panel overflow-hidden border-ca-primary/20 p-0">
        <div className="border-b border-ca-outline-variant/30 bg-gradient-to-br from-ca-primary/15 via-transparent to-ca-secondary/10 px-4 py-3 sm:px-6 sm:py-5">
          <div className="min-w-0 space-y-1 sm:space-y-2">
            <p className="font-label text-[10px] font-semibold text-ca-secondary sm:text-ca-label-sm">PRIMARY BUILD</p>
            <h3 className="flex flex-wrap items-center gap-2 font-headline text-lg font-bold text-ca-on-surface sm:text-xl lg:text-2xl">
              <span>{build.title}</span>
              <HelpHint text="추천 조합 제목은 이번 결과의 핵심 성향을 한 줄로 요약한 안내입니다. 앞쪽은 사운드 성향, 뒤쪽은 키감 성향을 뜻해요." />
            </h3>
            <p className="line-clamp-2 max-w-3xl text-sm leading-relaxed text-ca-on-surface-variant sm:line-clamp-none sm:text-base">
              {taglineHead}
              {taglineTail ? (
                <>
                  <br />
                  {taglineTail}
                </>
              ) : null}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
