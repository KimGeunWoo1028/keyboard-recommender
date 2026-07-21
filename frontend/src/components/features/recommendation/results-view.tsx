"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ResultsAuthLoadingShell } from "@/components/auth/results-auth-loading-shell";
import { RecommendationResultView } from "@/components/features/recommendation/recommendation-result-view";
import { buttonClassName } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { emitRefinementEventBestEffort } from "@/lib/api/onboarding-events";
import { postComputeRecommendation } from "@/lib/api/recommendations";
import { legacyTraitsFromApi } from "@/lib/recommendation-api-map";
import { getMockBuildFromTraits, getRecommendedBuildForSubmission } from "@/lib/recommendation-mock";
import { loadLastKnownGoodSubmission, loadSurveySubmission, saveSurveySubmission } from "@/lib/survey-storage";
import { submissionNeedsImageUrlRefresh, submissionNeedsSwagkeyUrlRefresh } from "@/lib/swagkey-source-links";
import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveyAnswers } from "@/types/survey";
import type { SurveySubmission } from "@/types/survey";

export function ResultsView() {
  const [hydrated, setHydrated] = useState(false);
  const [submission, setSubmission] = useState<SurveySubmission | null>(null);
  const [build, setBuild] = useState<RecommendedBuild | null>(null);
  const [refineError, setRefineError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadSurveySubmission() ?? loadLastKnownGoodSubmission();
    setSubmission(loaded);
    if (loaded) {
      const nl = loaded.nlPreferenceText?.trim();
      const build =
        nl ? getRecommendedBuildForSubmission(loaded) : loaded.build ?? getMockBuildFromTraits(loaded.traits, loaded.answers);
      setBuild(build);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !submission || submission.source !== "api") return;
    const picks = submission.recommendations ?? submission.matchExplanations ?? [];
    const hasMissingItemNames =
      picks.length === 0 || picks.some((pick) => !((pick as { itemName?: string }).itemName ?? "").trim());
    const buildSnapshot = [
      submission.build?.switches ?? "",
      submission.build?.plate ?? "",
      submission.build?.foam ?? "",
      submission.build?.layout ?? "",
      submission.build?.case ?? "",
    ].join(" ");
    const legacyMarkers = [
      "Long-pole linear",
      "Silent linear",
      "POM plate",
      "FR4 plate",
      "Aluminum plate",
      "Heavy damp",
      "Case + thin plate foam",
      "Minimal / no foam",
    ];
    const hasLegacyBuildText = legacyMarkers.some((marker) => buildSnapshot.includes(marker));
    const needsSwagkeyLinks = submissionNeedsSwagkeyUrlRefresh(submission);
    const needsImageUrls = submissionNeedsImageUrlRefresh(submission);
    const missingCaseInBuild = !(submission.build?.case ?? "").trim();
    const missingKeycapInBuild = !(submission.build?.keycap ?? "").trim();
    const needsRefresh =
      hasMissingItemNames ||
      hasLegacyBuildText ||
      needsSwagkeyLinks ||
      needsImageUrls ||
      missingCaseInBuild ||
      missingKeycapInBuild;
    if (!needsRefresh) return;

    let cancelled = false;
    const nl = submission.nlPreferenceText?.trim();

    void postComputeRecommendation(submission.answers, { naturalLanguage: nl || undefined })
      .then((res) => {
        if (cancelled) return;
        const refreshed: SurveySubmission = {
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
          ...(nl ? { nlPreferenceText: nl } : {}),
        };
        saveSurveySubmission(refreshed);
        setSubmission(refreshed);
        setBuild(res.build);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [hydrated, submission]);

  if (!hydrated) {
    return <ResultsAuthLoadingShell />;
  }

  if (!submission || !build) {
    return (
      <div className="rounded-xl border border-dashed border-ca-outline-variant/50 bg-ca-surface-container-lowest p-8 text-center">
        <p className="text-sm text-ca-on-surface-variant">
          아직 설문 결과가 없습니다. 설문을 완료하면 추천 결과를 확인할 수 있어요.
        </p>
        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/recommend" className={buttonClassName()}>
            설문 시작하기
          </Link>
          <Link href="/catalog" className={buttonClassName({ variant: "outline" })}>
            부품 카탈로그 둘러보기
          </Link>
        </div>
      </div>
    );
  }

  async function applyRefinement(
    patch: Partial<SurveyAnswers>,
    meta?: { label?: string; stepId: string; answerId: string },
  ): Promise<void> {
    if (!submission) return;
    const current = submission;
    const nextAnswers = { ...current.answers, ...patch } as SurveyAnswers;
    const nl = current.nlPreferenceText?.trim();
    const beforeConfidence = typeof current.overallConfidence === "number" ? current.overallConfidence : 0;
    try {
      const res = await postComputeRecommendation(nextAnswers, { naturalLanguage: nl || undefined });
      const nextSubmission: SurveySubmission = {
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
        ...(nl ? { nlPreferenceText: nl } : {}),
      };
      saveSurveySubmission(nextSubmission);
      setSubmission(nextSubmission);
      setBuild(res.build);
      setRefineError(null);
      void emitRefinementEventBestEffort({
        actionLabel: meta?.label ?? "quick_refine",
        stepId: meta?.stepId ?? "",
        answerId: meta?.answerId ?? "",
        confidenceBefore: beforeConfidence,
        confidenceAfter: res.overallConfidence,
        confidenceDelta: Number((res.overallConfidence - beforeConfidence).toFixed(6)),
        improved: res.overallConfidence > beforeConfidence,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status > 0
            ? `추천 재조정 요청에 실패했습니다. (${err.status}): ${err.message}`
            : err.message
          : err instanceof Error
            ? err.message
            : "추천 재조정에 실패했습니다.";
      setRefineError(message);
    }
  }

  return <RecommendationResultView submission={submission} build={build} onApplyRefinement={applyRefinement} refineError={refineError} />;
}
