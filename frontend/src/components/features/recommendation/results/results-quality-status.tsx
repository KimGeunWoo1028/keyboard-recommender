"use client";

import type { SurveySubmission } from "@/types/survey";

import { cn } from "@/lib/utils";

export type QualityStatusSubmission = Pick<
  SurveySubmission,
  | "confidenceGuidance"
  | "compatibilityAudit"
  | "fallbackAudit"
  | "recommendationConfidence"
>;

export type QualityStatusTone = "neutral" | "caution" | "warning";

export type QualityStatusDisplay = {
  badge: string;
  tone: QualityStatusTone;
  detail?: string;
};

function firstKoreanSummaryLine(audit: Record<string, unknown> | undefined): string | undefined {
  if (!audit || !Array.isArray(audit.summaryLines)) return undefined;
  for (const line of audit.summaryLines) {
    if (typeof line !== "string") continue;
    const trimmed = line.trim();
    if (!trimmed || !/[가-힣]/.test(trimmed)) continue;
    return trimmed;
  }
  return undefined;
}

function compatCounts(audit: Record<string, unknown> | undefined) {
  const penalty =
    typeof audit?.effectivePenaltyTotal === "number" ? audit.effectivePenaltyTotal : 0;
  const hardCount =
    typeof audit?.hardIncompatibilityCount === "number" ? audit.hardIncompatibilityCount : 0;
  const softCount = typeof audit?.softPenaltyCount === "number" ? audit.softPenaltyCount : 0;
  const warningCount = typeof audit?.warningCount === "number" ? audit.warningCount : 0;
  const hasHardIncompat = audit?.hasHardIncompatibility === true || hardCount > 0;
  return { penalty, hardCount, softCount, warningCount, hasHardIncompat };
}

function isNoteworthyCompatIssue(audit: Record<string, unknown> | undefined): boolean {
  const { penalty, hasHardIncompat } = compatCounts(audit);
  return hasHardIncompat || penalty > 0.08;
}

function compatDetailMessage(audit: Record<string, unknown> | undefined): string | undefined {
  const koreanLine = firstKoreanSummaryLine(audit);
  if (koreanLine) return koreanLine;

  const { penalty, hardCount, softCount, warningCount, hasHardIncompat } = compatCounts(audit);

  if (hasHardIncompat || hardCount > 0) {
    return "물리적으로 맞지 않을 수 있는 구성이 포함됐어요. 추천 근거와 대안을 확인해 보세요.";
  }
  if (penalty > 0.08 || softCount > 0) {
    return "일부 구성 조합에 호환성 보정이 적용됐어요. 추천 근거 탭에서 자세히 확인해 보세요.";
  }
  if (warningCount > 0) {
    return "흔하지 않지만 사용 가능한 조합이에요. 취향에 맞는지 추천 근거를 확인해 보세요.";
  }
  return undefined;
}

export function deriveQualityStatus(submission: QualityStatusSubmission): QualityStatusDisplay | null {
  if (submission.confidenceGuidance?.isLowConfidence) {
    return null;
  }

  const label = String(submission.recommendationConfidence?.label ?? "").toLowerCase();
  const compat = submission.compatibilityAudit;
  const fallback = submission.fallbackAudit;

  const fallbackRecovered = fallback?.recovered === true;
  const compatNoteworthy = isNoteworthyCompatIssue(compat);
  const compatDetail = compatNoteworthy ? compatDetailMessage(compat) : undefined;

  if (label === "high" && !fallbackRecovered && !compatNoteworthy) {
    return null;
  }

  if (fallbackRecovered) {
    return {
      badge: "참고용 추천",
      tone: "warning",
      detail:
        firstKoreanSummaryLine(compat) ??
        "조건을 조금 완화해 추천했어요. 다른 부품과 비교 목록도 함께 확인해 보세요.",
    };
  }

  if (label === "experimental") {
    return {
      badge: "참고용 추천",
      tone: "warning",
      detail: "비슷한 후보가 많아 이번 결과는 참고용으로 보시면 좋아요.",
    };
  }

  if (label === "balanced") {
    return {
      badge: "무난한 추천",
      tone: "caution",
      detail: compatDetail ?? "설문과 잘 맞지만, 대안 후보도 함께 비교해 보세요.",
    };
  }

  if (compatNoteworthy) {
    return {
      badge: "주의가 필요한 조합",
      tone: "caution",
      detail:
        compatDetail ??
        "일부 호환성 보정이 적용됐어요. 추천 근거 탭에서 자세히 확인해 보세요.",
    };
  }

  return null;
}

const toneClasses: Record<QualityStatusTone, string> = {
  neutral: "border-ca-outline-variant/50 bg-ca-surface-container/35 text-ca-on-surface",
  caution: "border-amber-500/35 bg-amber-500/8 text-amber-950 dark:text-amber-50",
  warning: "border-orange-500/35 bg-orange-500/8 text-orange-950 dark:text-orange-50",
};

const badgeClasses: Record<QualityStatusTone, string> = {
  neutral: "bg-ca-surface-container-highest/80 text-ca-on-surface",
  caution: "bg-amber-500/15 text-amber-900 dark:text-amber-100",
  warning: "bg-orange-500/15 text-orange-900 dark:text-orange-100",
};

export function ResultsQualityStatus({ submission }: { submission: QualityStatusSubmission }) {
  const status = deriveQualityStatus(submission);
  if (!status) return null;

  return (
    <div
      data-testid="e2e-quality-status"
      className={cn(
        "flex flex-col gap-2 rounded-lg border px-4 py-3 sm:flex-row sm:items-start sm:gap-3",
        toneClasses[status.tone],
      )}
      role="status"
    >
      <span
        className={cn(
          "inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-0.5 font-label text-ca-label-sm font-medium",
          badgeClasses[status.tone],
        )}
      >
        {status.badge}
      </span>
      {status.detail ? (
        <p className="text-sm leading-relaxed text-inherit opacity-90">{status.detail}</p>
      ) : null}
    </div>
  );
}
