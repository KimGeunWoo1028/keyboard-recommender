"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { SurveyOnboardingStyleIcon } from "@/components/features/recommendation/survey-option-icon";
import { SurveyQuestion } from "@/components/features/recommendation/survey-question";
import { SurveySegmentedProgress } from "@/components/features/recommendation/survey-segmented-progress";
import { Button } from "@/components/ui/button";
import { ApiError, getPublicApiBase } from "@/lib/api/client";
import {
  emitKpiEventBestEffort,
  emitNlVocabularySignalBestEffort,
  emitOnboardingEventBestEffort,
  emitResilienceEventBestEffort,
} from "@/lib/api/onboarding-events";
import { postComputeRecommendation } from "@/lib/api/recommendations";
import { legacyTraitsFromApi } from "@/lib/recommendation-api-map";
import { SURVEY_STEPS } from "@/lib/survey-definition";
import { computeTraitsFromAnswers, isCompleteSurveyAnswers } from "@/lib/survey-logic";
import { firstUnansweredStepIndex, selectedOptionLabel } from "@/lib/survey-step-navigation";
import { loadLastKnownGoodSubmission, loadSurveySubmission, saveSurveySubmission } from "@/lib/survey-storage";
import { cn } from "@/lib/utils";
import type { SurveyAnswers, SurveyStepId } from "@/types/survey";

const initialAnswers: Partial<SurveyAnswers> = {};
const LOADING_MESSAGES = [
  "취향을 분석하고 있어요...",
  "호환성을 확인하고 있어요...",
  "추천 결과를 정리하고 있어요...",
] as const;

function NavArrowBack({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </svg>
  );
}

function NavArrowForward({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </svg>
  );
}

type OnboardingStyle = {
  id: "creamy_quiet" | "crisp_expressive" | "balanced";
  label: string;
  blurb: string;
  seedAnswers: Partial<SurveyAnswers>;
};

const ONBOARDING_STYLES: readonly OnboardingStyle[] = [
  {
    id: "creamy_quiet",
    label: "부드럽고 조용한 성향",
    blurb: "저소음 세팅과 장시간 편안한 타이핑에 잘 맞아요.",
    seedAnswers: { sound_profile: "muted", switch_feel: "linear", bottom_out: "soft", volume: "quiet" },
  },
  {
    id: "crisp_expressive",
    label: "또렷하고 경쾌한 성향",
    blurb: "고음 어택이 분명하고 단단한 피드백을 원할 때 좋아요.",
    seedAnswers: { sound_profile: "clacky", switch_feel: "tactile_clear", bottom_out: "firm", volume: "loud" },
  },
  {
    id: "balanced",
    label: "균형형 타건감",
    blurb: "아직 취향을 탐색 중이라면 무난한 시작점이에요.",
    seedAnswers: { sound_profile: "balanced", typing_pressure: "medium", bottom_out: "medium", volume: "moderate" },
  },
];

export function SurveyWizard() {
  const router = useRouter();
  const [phase, setPhase] = useState<"entry" | "questions">("entry");
  const [selectedStyle, setSelectedStyle] = useState<OnboardingStyle["id"] | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<SurveyAnswers>>(initialAnswers);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nlPreferenceText, setNlPreferenceText] = useState("");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [hasPreviousSession, setHasPreviousSession] = useState(false);
  const [lastKnownGoodAvailable, setLastKnownGoodAvailable] = useState(false);
  const [seededStepIds, setSeededStepIds] = useState<ReadonlySet<SurveyStepId>>(() => new Set());
  const viewedRef = useRef(false);
  const completedRef = useRef(false);
  const phaseRef = useRef(phase);
  const stepIndexRef = useRef(stepIndex);
  const onboardingViewedAtRef = useRef<number | null>(null);

  const totalSteps = SURVEY_STEPS.length;
  const currentStep = SURVEY_STEPS[stepIndex]!;
  const currentAnswer = answers[currentStep.id];
  const canGoNext = currentAnswer !== undefined;
  const surveyComplete = isCompleteSurveyAnswers(answers);
  const isLastStep = stepIndex === totalSteps - 1;

  const stepLabel = useMemo(() => `${stepIndex + 1} / ${totalSteps} 단계`, [stepIndex, totalSteps]);
  const loadingMessage = LOADING_MESSAGES[loadingMessageIndex] ?? LOADING_MESSAGES[0];
  const isPrefilledStep = seededStepIds.has(currentStep.id) && currentAnswer !== undefined;
  const prefilledLabel = isPrefilledStep ? selectedOptionLabel(currentStep.id, currentAnswer) : null;

  function durationSinceViewMs(): number | undefined {
    const t0 = onboardingViewedAtRef.current;
    if (t0 === null) return undefined;
    return Math.round((globalThis.performance?.now?.() ?? Date.now()) - t0);
  }

  useEffect(() => {
    if (!submitting) return;
    const timer = window.setInterval(() => {
      setLoadingMessageIndex((idx) => (idx + 1) % LOADING_MESSAGES.length);
    }, 700);
    return () => window.clearInterval(timer);
  }, [submitting]);

  useEffect(() => {
    phaseRef.current = phase;
    stepIndexRef.current = stepIndex;
  }, [phase, stepIndex]);

  useEffect(() => {
    if (!viewedRef.current) {
      viewedRef.current = true;
      onboardingViewedAtRef.current = globalThis.performance?.now?.() ?? Date.now();
      void emitOnboardingEventBestEffort("onboarding.viewed");
      const prev = loadSurveySubmission();
      if (prev?.answers) {
        setAnswers(prev.answers);
        setHasPreviousSession(true);
      }
      setLastKnownGoodAvailable(!!loadLastKnownGoodSubmission());
    }
    return () => {
      if (!completedRef.current) {
        void emitOnboardingEventBestEffort("onboarding.abandoned", {
          phase: phaseRef.current,
          stepIndex: stepIndexRef.current,
        });
      }
    };
  }, []);

  function setAnswer<S extends SurveyStepId>(stepId: S, value: SurveyAnswers[S]) {
    setAnswers((prev) => ({ ...prev, [stepId]: value }));
  }

  function goNext() {
    if (!canGoNext || isLastStep) return;
    if (isPrefilledStep) {
      void emitOnboardingEventBestEffort("onboarding.prefilled_step_skipped", {
        stepId: currentStep.id,
        stepIndex,
        style: selectedStyle,
        auto: false,
      });
    }
    void emitOnboardingEventBestEffort("onboarding.step_completed", {
      stepId: currentStep.id,
      answer: currentAnswer,
      stepIndex,
      duration_since_view_ms: durationSinceViewMs(),
      prefilledFromStyle: isPrefilledStep,
    });
    setStepIndex((i) => i + 1);
  }

  function goBack() {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    }
  }

  async function submitWithAnswers(submitAnswers: SurveyAnswers) {
    const t0 = globalThis.performance?.now?.() ?? Date.now();
    void emitOnboardingEventBestEffort("onboarding.generate_started", {
      answeredSteps: Object.keys(submitAnswers).length,
      style: selectedStyle,
      mode: "full",
      duration_since_view_ms: durationSinceViewMs(),
    });
    setSubmitting(true);
    setSubmitError(null);
    try {
      const apiBase = getPublicApiBase();
      const nl = nlPreferenceText.trim();
      const nlField = nl ? { nlPreferenceText: nl } : {};

      if (apiBase) {
        try {
          const res = await postComputeRecommendation(submitAnswers, {
            naturalLanguage: nl || undefined,
          });
          saveSurveySubmission({
            version: 2,
            answers: res.answers,
            traits: legacyTraitsFromApi(res.legacyTraits),
            completedAtIso: res.completedAtIso,
            build: res.build,
            source: "api",
            apiUserVector: res.userVector,
            userTraitScores: res.userTraitScores,
            traitAxes: res.traitAxes,
            recommendations: res.recommendations,
            matchExplanations: res.matchExplanations,
            overallConfidence: res.overallConfidence,
            ...(res.nlPreferenceAnalysis ? { nlPreferenceAnalysis: res.nlPreferenceAnalysis } : {}),
            ...(res.compatibilityAudit ? { compatibilityAudit: res.compatibilityAudit } : {}),
            ...(res.diversityAudit ? { diversityAudit: res.diversityAudit } : {}),
            ...(res.fallbackAudit ? { fallbackAudit: res.fallbackAudit } : {}),
            ...(res.recommendationConfidence ? { recommendationConfidence: res.recommendationConfidence } : {}),
            ...(res.feedbackLearning ? { feedbackLearning: res.feedbackLearning } : {}),
            ...(res.confidenceGuidance ? { confidenceGuidance: res.confidenceGuidance } : {}),
            ...(res.degradedReason ? { degradedReason: res.degradedReason } : {}),
            ...nlField,
          });
          const dt = (globalThis.performance?.now?.() ?? Date.now()) - t0;
          // KPI: time to first result (best-effort, never blocks)
          void emitKpiEventBestEffort("kpi.time_to_first_result", {
            duration_ms: Math.round(dt),
            requestedMode: "full",
            source: "survey_wizard",
          });
          if (res.degradedReason) {
            void emitResilienceEventBestEffort("interaction.degraded_fallback", {
              reason: res.degradedReason,
              requestedMode: "full",
              runMode: res.runMode ?? "full",
            });
          }
          if (nl && res.nlPreferenceAnalysis?.applied) {
            const unknown = (res.nlPreferenceAnalysis.unknownTokens ?? []).slice(0, 20);
            void emitNlVocabularySignalBestEffort({
              parser: "backend_terminology_v1",
              parsingConfidence: res.nlPreferenceAnalysis.parsingConfidence,
              matchedTermIds: (res.nlPreferenceAnalysis.matchedTermIds ?? []).slice(0, 20),
              unknownTokens: unknown,
              unknownTokenCount: unknown.length,
              naturalLanguageLength: nl.length,
              naturalLanguageText: nl.slice(0, 200),
              mode: "full",
              source: "survey_wizard",
            });
          }
        } catch (err) {
          const unreachable =
            err instanceof ApiError &&
            err.status === 0 &&
            (err.message.includes("Could not reach") ||
              err.message.includes("Failed to fetch") ||
              err.message.toLowerCase().includes("network") ||
              err.message.includes("연결에 실패"));
          if (!unreachable) throw err;
          const traits = computeTraitsFromAnswers(submitAnswers);
          saveSurveySubmission({
            version: 2,
            answers: submitAnswers,
            traits,
            completedAtIso: new Date().toISOString(),
            source: "local",
            apiUnreachableFallback: true,
            ...nlField,
          });
        }
      } else {
        const traits = computeTraitsFromAnswers(submitAnswers);
        saveSurveySubmission({
          version: 2,
          answers: submitAnswers,
          traits,
          completedAtIso: new Date().toISOString(),
          source: "local",
          ...nlField,
        });
      }
      completedRef.current = true;
      void emitOnboardingEventBestEffort("onboarding.completed", {
        style: selectedStyle,
        answeredSteps: Object.keys(submitAnswers).length,
        mode: "full",
      });
      router.push("/results");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 422
              ? `설문 입력값이 올바르지 않습니다: ${err.message}`
            : err.status > 0
              ? `요청 처리에 실패했습니다 (${err.status}): ${err.message}`
              : err.message
          : err instanceof Error
            ? err.message
            : "요청 처리 중 문제가 발생했습니다.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function finish() {
    if (!isCompleteSurveyAnswers(answers)) return;
    await submitWithAnswers(answers);
  }

  function recoverLastKnownGood() {
    const last = loadLastKnownGoodSubmission();
    if (!last) return;
    saveSurveySubmission(last);
    void emitResilienceEventBestEffort("interaction.last_known_good_restore", {
      source: "survey_wizard",
      hasBuild: !!last.build,
    });
    router.push("/results");
  }

  function reset() {
    setPhase("entry");
    setSelectedStyle(null);
    setStepIndex(0);
    setAnswers(initialAnswers);
    setSeededStepIds(new Set());
    setNlPreferenceText("");
    setSubmitError(null);
  }

  function chooseStyle(style: OnboardingStyle) {
    const merged = { ...style.seedAnswers };
    const entryStep = firstUnansweredStepIndex(merged);
    setSelectedStyle(style.id);
    setAnswers((prev) => ({ ...merged, ...prev }));
    setSeededStepIds(new Set(Object.keys(style.seedAnswers) as SurveyStepId[]));
    setStepIndex(entryStep);
    setPhase("questions");
    for (let i = 0; i < entryStep; i += 1) {
      const step = SURVEY_STEPS[i]!;
      void emitOnboardingEventBestEffort("onboarding.prefilled_step_skipped", {
        stepId: step.id,
        stepIndex: i,
        style: style.id,
        auto: true,
      });
    }
    void emitOnboardingEventBestEffort("onboarding.style_selected", {
      style: style.id,
      entryStepIndex: entryStep,
      prefilledStepCount: Object.keys(style.seedAnswers).length,
      duration_since_view_ms: durationSinceViewMs(),
    });
  }

  if (submitting) {
    return (
      <div
        className="survey-curator-shell survey-curator-viewport flex h-full w-full flex-col justify-center"
        data-testid="e2e-survey-wizard"
        aria-live="polite"
      >
        <div className="text-center">
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.15em] text-ca-primary sm:text-xs">Generating</p>
          <h2 className="mt-3 font-headline text-xl font-bold text-ca-on-surface sm:text-2xl">추천 결과를 생성하고 있어요</h2>
          <p className="mt-1 text-xs text-ca-on-surface-variant sm:text-sm">2 / 3 단계 · 잠시만 기다려 주세요.</p>
        </div>
        <p className="mt-6 text-center text-sm font-medium text-ca-on-surface">{loadingMessage}</p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container/50 sm:h-24"
            />
          ))}
        </div>
      </div>
    );
  }

  if (phase === "entry") {
    return (
      <div
        className="survey-curator-shell survey-curator-viewport flex h-full w-full flex-col gap-4 sm:gap-6"
        data-testid="e2e-survey-wizard"
      >
        <div className="shrink-0 text-center">
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.15em] text-ca-primary sm:text-xs">Step 01 of 03</p>
          <h2 className="mt-3 font-headline text-xl font-bold text-ca-on-surface sm:text-2xl">취향에 맞는 키보드 찾기</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
            스타일을 고른 뒤 약 1분 설문으로 추천을 받을 수 있어요.
          </p>
        </div>

        <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {ONBOARDING_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => chooseStyle(style)}
              className="survey-option-tile group flex h-full min-h-0 flex-col items-center justify-center gap-3 rounded-xl border border-ca-outline-variant/50 bg-ca-surface-container p-5 text-center transition-all hover:border-ca-on-surface-variant/60 sm:gap-4 sm:p-6"
            >
              <SurveyOnboardingStyleIcon
                styleId={style.id}
                className="h-10 w-10 shrink-0 sm:h-12 sm:w-12"
              />
              <div className="w-full space-y-2">
                <p className="font-headline text-base font-semibold leading-tight text-ca-on-surface sm:text-lg">
                  {style.label}
                </p>
                <p className="mx-auto line-clamp-3 text-sm leading-snug text-ca-on-surface-variant sm:text-base">
                  {style.blurb}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-auto flex shrink-0 flex-col items-center gap-2 text-center">
          {hasPreviousSession ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => {
                setStepIndex(firstUnansweredStepIndex(answers));
                setPhase("questions");
              }}
            >
              이어서 설정하기
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className="survey-curator-shell survey-curator-viewport flex h-full min-h-0 w-full flex-col gap-2 sm:gap-3"
      data-testid="e2e-survey-wizard"
    >
      <SurveySegmentedProgress
        currentStep={stepIndex + 1}
        totalSteps={totalSteps}
        timeEstimate="약 1분"
      />

      {isPrefilledStep && prefilledLabel ? (
        <div
          data-testid="e2e-prefilled-step-banner"
          className="survey-prefilled-banner flex shrink-0 flex-col items-center justify-center rounded-xl border border-ca-primary/30 bg-ca-primary/10 px-4 py-3 text-center sm:py-4"
        >
          <p className="text-xs font-medium text-ca-on-surface sm:text-sm">스타일 프리셋에서 이미 선택됨</p>
          <p className="mt-1 text-sm font-semibold text-ca-primary sm:text-base">
            {prefilledLabel.replace(/\s*\([^)]*\)\s*$/, "").trim()}
          </p>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-[2] flex-col">
        <SurveyQuestion
          key={currentStep.id}
          step={currentStep}
          value={answers[currentStep.id]}
          onChange={(id) => setAnswer(currentStep.id, id)}
          className="h-full"
        />
      </div>

      <div className="survey-nl-panel flex min-h-0 flex-1 flex-col border-t border-ca-outline-variant/40 pt-3">
        <label
          htmlFor="nl-preference"
          className="mb-2 block shrink-0 font-label text-[10px] font-bold uppercase tracking-widest text-ca-on-surface-variant sm:text-xs"
        >
          추가 취향 입력 (선택)
        </label>
        <textarea
          id="nl-preference"
          data-testid="e2e-nl-preference"
          value={nlPreferenceText}
          onChange={(e) => setNlPreferenceText(e.target.value)}
          disabled={submitting}
          placeholder="더 구체적인 취향이 있다면 입력해 주세요 (예: 조용하고 부드러운 타건감)"
          className={cn(
            "ca-input min-h-[4.5rem] w-full flex-1 resize-none rounded-xl border-ca-outline-variant/50 bg-ca-surface-container py-2.5 text-sm",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
      </div>

      {submitError ? (
        <div className="shrink-0 space-y-1 text-center" role="alert">
          <p className="text-xs text-destructive sm:text-sm">{submitError}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {isLastStep ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void emitResilienceEventBestEffort("interaction.retry", { trigger: "manual_retry_button" });
                  void finish();
                }}
              >
                요청 다시 시도
              </Button>
            ) : null}
            {lastKnownGoodAvailable ? (
              <Button type="button" variant="outline" size="sm" onClick={recoverLastKnownGood}>
                마지막 성공 결과 보기
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-2 pb-1 pt-1 sm:flex-nowrap sm:gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0 || submitting}
          className="group flex shrink-0 items-center gap-1.5 text-xs font-medium text-ca-on-surface-variant transition-colors hover:text-ca-on-surface disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
        >
          <NavArrowBack className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          이전
        </button>

        <div className="order-3 flex min-w-0 basis-full items-center justify-center gap-1.5 sm:order-none sm:basis-auto sm:flex-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setPhase("entry")}
            disabled={submitting}
            className="survey-nav-secondary"
          >
            스타일 선택으로
          </button>
          <button type="button" onClick={reset} disabled={submitting} className="survey-nav-secondary">
            처음부터 다시
          </button>
        </div>

        {!isLastStep ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext || submitting}
            className="survey-curator-nav-next group shrink-0 text-xs sm:text-sm"
          >
            다음
            <NavArrowForward className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        ) : (
          <button
            type="button"
            data-testid="e2e-submit-survey"
            onClick={() => void finish()}
            disabled={!surveyComplete || submitting}
            className="survey-curator-nav-next group shrink-0 text-xs sm:text-sm"
          >
            결과 보기
            <NavArrowForward className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
