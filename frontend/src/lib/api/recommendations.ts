import { ApiError, getPublicApiBase, readErrorMessage } from "@/lib/api/client";
import { emitResilienceEventBestEffort } from "@/lib/api/onboarding-events";
import { parseRecommendationApiResponse } from "@/lib/api/recommendation-response";
import type { RecommendationApiResponse } from "@/types/recommendation-api";
import type { SurveyAnswers } from "@/types/survey";

const COMPUTE_PATH = "/api/v1/recommendations/compute";

export type PostComputeRecommendationOptions = {
  /** Sent as `naturalLanguage`; parsed server-side with the terminology layer (no LLM). */
  naturalLanguage?: string;
};

export async function postComputeRecommendation(
  answers: SurveyAnswers,
  options?: PostComputeRecommendationOptions,
): Promise<RecommendationApiResponse> {
  const base = getPublicApiBase();
  if (!base) {
    throw new ApiError(0, "현재 추천 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
  }

  const url = `${base}${COMPUTE_PATH}`;
  async function runOnce(timeoutMs: number): Promise<Response> {
    const nl = options?.naturalLanguage?.trim();
    const body: SurveyAnswers & { naturalLanguage?: string } = { ...answers };
    if (nl) body.naturalLanguage = nl;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }
  let res: Response;
  try {
    try {
      res = await runOnce(9000);
    } catch {
      // Retry once for weak/unstable network conditions.
      void emitResilienceEventBestEffort("interaction.retry", { trigger: "auto_retry_after_timeout_or_network_error" });
      res = await runOnce(12000);
    }
  } catch (err) {
    const reason =
      err instanceof Error ? err.message : "Network error";
    throw new ApiError(0, `추천 서버 연결에 실패했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요. (${reason})`, reason);
  }

  if (!res.ok) {
    const detail = await readErrorMessage(res);
    throw new ApiError(res.status, detail || `Request failed (${res.status})`, detail);
  }

  const json: unknown = await res.json();
  return parseRecommendationApiResponse(json);
}
