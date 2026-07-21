import type { SurveySubmission } from "@/types/survey";

import { pickRunnerUpScoreGap, rankingThresholdsForDomain } from "./results-ranking-thresholds";
import { deriveQualityStatus, type QualityStatusSubmission } from "./results-quality-status";

type ApiPick = NonNullable<SurveySubmission["recommendations"]>[number];

export type ConfidenceStoryBullet = {
  kind: "check" | "dot";
  text: string;
};

export type ConfidenceStoryRefineAction = {
  label: string;
  stepId: string;
  answerId: string;
};

export type ConfidenceStoryModel = {
  headline: string;
  bullets: ConfidenceStoryBullet[];
  refineActions?: ConfidenceStoryRefineAction[];
};

export type ConfidenceStoryInput = QualityStatusSubmission & {
  confidenceGuidance?: SurveySubmission["confidenceGuidance"];
};

function maxPickRunnerUpGap(apiPicks: ApiPick[]): number {
  let maxGap = 0;
  for (const pick of apiPicks) {
    const runnerUp = pick.alternatives?.[0];
    if (!runnerUp || typeof pick.score !== "number" || typeof runnerUp.score !== "number") continue;
    maxGap = Math.max(maxGap, pickRunnerUpScoreGap(pick.score, runnerUp.score));
  }
  return maxGap;
}

function hasRunnerUp(apiPicks: ApiPick[]): boolean {
  return apiPicks.some((pick) => pick.alternatives?.[0]);
}

function isGapSufficient(apiPicks: ApiPick[]): boolean {
  if (!hasRunnerUp(apiPicks)) return true;
  for (const pick of apiPicks) {
    const runnerUp = pick.alternatives?.[0];
    if (!runnerUp || typeof pick.score !== "number" || typeof runnerUp.score !== "number") continue;
    const gap = pickRunnerUpScoreGap(pick.score, runnerUp.score);
    const { scoreGapMin } = rankingThresholdsForDomain(pick.domain);
    if (gap >= scoreGapMin) return true;
  }
  return maxPickRunnerUpGap(apiPicks) >= 0.04;
}

function pushUniqueBullet(bullets: ConfidenceStoryBullet[], bullet: ConfidenceStoryBullet) {
  if (bullets.some((row) => row.text === bullet.text)) return;
  bullets.push(bullet);
}

export function deriveConfidenceStory(
  submission: ConfidenceStoryInput,
  apiPicks: ApiPick[],
): ConfidenceStoryModel | null {
  const label = String(submission.recommendationConfidence?.label ?? "").toLowerCase();
  const guidance = submission.confidenceGuidance;

  if (!label && !guidance?.isLowConfidence) return null;

  const gapSufficient = isGapSufficient(apiPicks);
  const qualityStatus = deriveQualityStatus(submission);
  const bullets: ConfidenceStoryBullet[] = [];

  if (guidance?.isLowConfidence) {
    pushUniqueBullet(bullets, {
      kind: "check",
      text: guidance.shortReason?.trim() || "일부 응답이 엇갈렸어요",
    });
    pushUniqueBullet(bullets, {
      kind: "dot",
      text: "후보가 비슷해서 취향에 따라 선택이 달라질 수 있어요",
    });

    return {
      headline: "설문 맞춤: 보통",
      bullets: bullets.slice(0, 4),
      refineActions: (guidance.actions ?? []).slice(0, 2).map((action) => ({
        label: action.label,
        stepId: action.stepId,
        answerId: action.answerId,
      })),
    };
  }

  let headline = "설문 맞춤: 높은 편";

  if (submission.fallbackAudit?.recovered === true || label === "experimental") {
    headline = "설문 맞춤: 참고용";
    pushUniqueBullet(bullets, {
      kind: "dot",
      text: qualityStatus?.detail ?? "비슷한 후보가 많아 이번 결과는 참고용으로 보시면 좋아요",
    });
  } else if (label === "balanced" || (hasRunnerUp(apiPicks) && !gapSufficient)) {
    headline = "설문 맞춤: 보통";
    pushUniqueBullet(bullets, { kind: "check", text: "일부 응답이 엇갈렸어요" });
    if (!gapSufficient) {
      pushUniqueBullet(bullets, {
        kind: "dot",
        text: "후보가 비슷해서 취향에 따라 선택이 달라질 수 있어요",
      });
    } else {
      pushUniqueBullet(bullets, { kind: "check", text: "설문과 잘 맞는 조합이에요" });
    }
  } else {
    pushUniqueBullet(bullets, { kind: "check", text: "선호가 일관되게 나타났어요" });
    pushUniqueBullet(bullets, {
      kind: "check",
      text: "비슷한 후보보다 설문과 더 잘 맞는 쪽이에요",
    });
  }

  if (qualityStatus?.detail) {
    const isCompatOrWarning =
      qualityStatus.tone === "warning" ||
      qualityStatus.tone === "caution" ||
      /호환|주의|완화|참고/.test(qualityStatus.detail);
    if (isCompatOrWarning) {
      pushUniqueBullet(bullets, { kind: "dot", text: qualityStatus.detail });
    }
  }

  if (headline === "설문 맞춤: 높은 편") {
    const hasWarning = bullets.some((row) => /호환|주의|완화|참고/.test(row.text));
    if (!hasWarning) {
      pushUniqueBullet(bullets, { kind: "check", text: "큰 호환성 문제는 없어요" });
    }
  }

  return {
    headline,
    bullets: bullets.slice(0, 4),
  };
}
