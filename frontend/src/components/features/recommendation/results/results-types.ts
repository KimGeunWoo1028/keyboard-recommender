export type BackendResultTabId = "overview" | "evidence";
export type LiteResultTabId = "overview" | "evidence";

/** Overview CTA: 저장만. 부품별 스웨그키 링크는 6축·대안·카탈로그에서 제공. */
export const BACKEND_RESULT_TABS: { id: BackendResultTabId; label: string }[] = [
  { id: "overview", label: "추천 요약" },
  { id: "evidence", label: "추천 근거" },
];

export const LITE_RESULT_TABS: { id: LiteResultTabId; label: string }[] = [
  { id: "overview", label: "추천 요약" },
  { id: "evidence", label: "추천 근거" },
];
