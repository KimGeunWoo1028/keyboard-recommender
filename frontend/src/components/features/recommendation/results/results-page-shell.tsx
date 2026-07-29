"use client";

import type { ReactNode } from "react";

import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";

import { deriveConfidenceStory } from "./results-confidence-story-content";
import { ResultTabBar } from "./results-tab-shell";
import type { ResultTabId } from "./results-types";
import { preferenceTagsFromAnswers } from "./shared-result-header";

const soundLabelMap: Record<SurveySubmission["answers"]["sound_profile"], string> = {
  thocky: "묵직한 저음",
  clacky: "또렷한 고음",
  muted: "차분한 소리",
  balanced: "균형형 사운드",
  bright: "밝고 생동감 있는 고음",
};
const switchFeelLabelMap: Record<SurveySubmission["answers"]["switch_feel"], string> = {
  linear: "매끈한 키감",
  tactile_light: "은은한 구분감",
  tactile_clear: "뚜렷한 구분감",
};
function resultsHeadline(answers: SurveySubmission["answers"]): string {
  return `${soundLabelMap[answers.sound_profile]} · ${switchFeelLabelMap[answers.switch_feel]}`;
}

export function ResultsPageShell({
  submission,
  activeTab,
  onTabChange,
  headerActions,
  children,
}: {
  submission: SurveySubmission;
  /** Kept for call-site compatibility. */
  build: RecommendedBuild;
  activeTab: ResultTabId;
  onTabChange: (tab: ResultTabId) => void;
  headerActions?: ReactNode;
  children: ReactNode;
}) {
  const { answers } = submission;
  const tags = preferenceTagsFromAnswers(answers);
  const story = deriveConfidenceStory(submission, submission.recommendations ?? []);
  const headline = resultsHeadline(answers);

  return (
    <>
      {/* Match catalog/survey: gray band = page identity only; tabs live in white body. */}
      <div className="border-b border-border bg-[#F8F9FA] dark:bg-[rgb(22_22_35)]">
        <div className="mx-auto max-w-ca px-ca-margin-mobile py-10 sm:px-ca-margin sm:py-12">
          <div
            className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
            data-testid="e2e-result-trust-summary"
          >
            <div className="min-w-0 space-y-2">
              <p className="section-label mb-3">Results</p>
              <h1 className="font-headline text-3xl font-black tracking-tight text-ca-on-surface sm:text-4xl">
                {headline}
              </h1>
              {tags.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5 pt-1" aria-label="취향 태그">
                  {tags.map((tag) => (
                    <li
                      key={tag}
                      className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary dark:border-[rgb(165_180_252)]/25 dark:text-[rgb(165_180_252)]"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
              {story?.support ? (
                <p
                  className="max-w-3xl break-keep text-sm leading-relaxed text-ca-on-surface-variant"
                  data-testid="e2e-trust-short-why"
                >
                  {story.support}
                </p>
              ) : null}
              <p className="max-w-3xl break-keep text-xs leading-relaxed text-ca-on-surface-variant/90">
                점수는 구매 만족이나 품질 보증이 아니라, 설문 취향과의 맞춤 정도를 안내합니다.
              </p>
            </div>
            {headerActions ? <div className="shrink-0 sm:pt-1">{headerActions}</div> : null}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-ca-surface">
        <div className="mx-auto max-w-ca px-ca-margin-mobile pt-6 sm:px-ca-margin sm:pt-8">
          <ResultTabBar activeTab={activeTab} onTabChange={onTabChange} />
        </div>
        <div className="mx-auto max-w-ca px-ca-margin-mobile py-8 sm:px-ca-margin sm:py-10">{children}</div>
      </div>
    </>
  );
}
