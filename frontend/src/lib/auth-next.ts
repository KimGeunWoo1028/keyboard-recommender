/**
 * Safe post-auth redirect targets (open-redirect guard).
 * Only same-origin relative paths are allowed.
 */
export function safeAuthNextPath(raw: string | null | undefined, fallback = "/results"): string {
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://")) return fallback;
  if (trimmed.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(trimmed)) return fallback;
  return trimmed;
}

export type AuthEntryContext = "results_save" | "mypage" | "recommend" | "generic";

export function authEntryContext(nextPath: string | null): AuthEntryContext {
  if (!nextPath) return "generic";
  const path = nextPath.split("?")[0] ?? nextPath;
  if (path === "/results" || path.startsWith("/results/")) return "results_save";
  if (path === "/mypage" || path.startsWith("/mypage/")) return "mypage";
  if (path === "/recommend" || path.startsWith("/recommend/")) return "recommend";
  return "generic";
}

export function authLoginContextCopy(ctx: AuthEntryContext): { title: string; body: string; benefits?: string[] } {
  switch (ctx) {
    case "results_save":
      return {
        title: "로그인",
        body: "추천 결과를 계정에 저장하려면 로그인하세요. 로그인 후 현재 결과로 돌아옵니다.",
        benefits: ["다른 기기에서도 저장한 결과 확인", "최근 추천 결과 이어보기"],
      };
    case "mypage":
      return {
        title: "로그인",
        body: "계정으로 로그인하고 저장한 결과를 이어가세요.",
        benefits: ["저장한 결과 관리", "최근 추천 결과 다시 열기"],
      };
    case "recommend":
      return {
        title: "로그인",
        body: "로그인하면 추천 설문을 바로 이어서 시작할 수 있어요.",
      };
    default:
      return {
        title: "로그인",
        body: "Keyboard Recommender 계정으로 로그인하세요.",
      };
  }
}
