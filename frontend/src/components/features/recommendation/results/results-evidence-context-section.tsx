"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EVIDENCE_STORY_STEPS } from "@/lib/keyboard-terminology";
import type { SurveySubmission } from "@/types/survey";

import { HelpHint } from "./help-hint";
import { ResultsEvidenceStorySectionHeader } from "./results-evidence-story-section-header";

export type ResultsEvidenceContextSectionProps = {
  submission: SurveySubmission;
};

export function ResultsEvidenceContextSection({ submission }: ResultsEvidenceContextSectionProps) {
  const hasContext = !!submission.feedbackLearning || !!submission.nlPreferenceText?.trim();
  if (!hasContext) return null;

  return (
    <section className="space-y-4">
      <ResultsEvidenceStorySectionHeader
        title={EVIDENCE_STORY_STEPS[1].title}
        description={EVIDENCE_STORY_STEPS[1].description}
      />

      {submission.feedbackLearning ? (
        <Card className="border-border/80 bg-muted/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span>피드백 반영 노트</span>
              <HelpHint text="최근 저장·비교·조회 같은 상호작용 신호를 바탕으로 소규모 가중치가 보정되었는지 보여줍니다." />
            </CardTitle>
            <CardDescription>최근 상호작용 신호를 기반으로 적용된 소규모 가중치 보정입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {submission.feedbackLearning.applied ? (
              <>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {(submission.feedbackLearning.lines ?? []).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                {submission.feedbackLearning.personalizationMetrics ? (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    개인화 지표: 가중 신호 질량{" "}
                    {submission.feedbackLearning.personalizationMetrics.weightedMass?.toFixed?.(2) ?? "—"}
                    {submission.feedbackLearning.personalizationMetrics.gatedTraitNudges
                      ? " · 희소 행동으로 축 힌트 축소 적용"
                      : ""}
                    {typeof submission.feedbackLearning.personalizationMetrics.traitNudgeL1 === "number"
                      ? ` · 축 힌트 L1 ${submission.feedbackLearning.personalizationMetrics.traitNudgeL1.toFixed(3)}`
                      : ""}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {submission.feedbackLearning.reason ?? "최근 반영된 상호작용 신호가 없습니다."}
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {submission.nlPreferenceText?.trim() ? (
        <Card className="border-border/70 bg-muted/15">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span>자유 입력 취향</span>
              <HelpHint text="설문 외에 입력한 문장을 커뮤니티 용어 사전으로 해석해 취향 벡터에 반영한 내용입니다." />
            </CardTitle>
            <CardDescription>
              {submission.nlPreferenceAnalysis?.applied ? (
                <>
                  서버에서 분석되어 설문과 동일한 취향 벡터에 반영되었습니다. 현재 해석 신뢰도{" "}
                  {(submission.nlPreferenceAnalysis.parsingConfidence * 100).toFixed(0)}%.
                </>
              ) : (
                <>설문에서 저장된 문장입니다. 최신 추천을 다시 실행하면 서버 해석 정보가 함께 표시됩니다.</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="rounded-md border border-dashed border-border/80 bg-background/50 p-3 text-sm text-muted-foreground">
              {submission.nlPreferenceText.trim()}
            </p>
            {submission.nlPreferenceAnalysis?.applied ? (
              <div className="space-y-2 text-xs text-muted-foreground">
                {submission.nlPreferenceAnalysis.matchedTermIds.length > 0 ? (
                  <p>
                    <span className="font-semibold text-foreground">인식된 용어: </span>
                    {submission.nlPreferenceAnalysis.matchedTermIds.join(", ")}
                  </p>
                ) : null}
                {submission.nlPreferenceAnalysis.unknownTokens.length > 0 ? (
                  <p>
                    <span className="font-semibold text-foreground">미인식 단어: </span>
                    {submission.nlPreferenceAnalysis.unknownTokens.join(", ")}
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
