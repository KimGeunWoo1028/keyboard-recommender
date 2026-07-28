export type ResultTabId = "overview" | "evidence" | "compare";

/** @deprecated Use ResultTabId */
export type BackendResultTabId = ResultTabId;
/** @deprecated Use ResultTabId */
export type LiteResultTabId = ResultTabId;

export const RESULT_TABS: { id: ResultTabId; label: string }[] = [
  { id: "overview", label: "개요" },
  { id: "evidence", label: "근거" },
  { id: "compare", label: "비교" },
];

/** @deprecated Use RESULT_TABS */
export const BACKEND_RESULT_TABS = RESULT_TABS;
/** @deprecated Use RESULT_TABS */
export const LITE_RESULT_TABS = RESULT_TABS;
