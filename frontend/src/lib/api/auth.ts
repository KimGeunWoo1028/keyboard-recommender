import { ApiError, getPublicApiBase, readErrorMessage } from "@/lib/api/client";

export type AuthUser = {
  id: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  created_at: string;
};

export type AccountSecuritySummary = {
  active_session_count: number;
  last_login_at?: string | null;
};

type AuthEnvelope = { user: AuthUser };
type MeEnvelope = { user: AuthUser | null };
const AUTH_CHANGED_EVENT = "kr-auth-changed";

export type AuthChangedDetail = {
  /** When set, header applies this immediately (avoids /me race after login/logout). */
  user?: AuthUser | null;
};

function emitAuthChanged(detail?: AuthChangedDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AuthChangedDetail>(AUTH_CHANGED_EVENT, { detail: detail ?? {} }));
}

function isRetryableAuthResponseStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postAuth(path: string, body: Record<string, unknown>): Promise<AuthUser> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  const json = (await res.json()) as AuthEnvelope;
  emitAuthChanged({ user: json.user });
  return json.user;
}

export async function signup(input: {
  email: string;
  verification_token: string;
  password: string;
  display_name?: string;
}): Promise<AuthUser> {
  return postAuth("/api/v1/auth/signup", input);
}

export async function login(input: { email: string; password: string }): Promise<AuthUser> {
  return postAuth("/api/v1/auth/login", input);
}

export async function logout(): Promise<void> {
  const base = getPublicApiBase();
  if (!base) return;
  const res = await fetch(`${base}/api/v1/auth/logout`, {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) throw new ApiError(res.status, await readErrorMessage(res));
  emitAuthChanged({ user: null });
}

export async function logoutAllSessions(): Promise<void> {
  const base = getPublicApiBase();
  if (!base) return;
  const res = await fetch(`${base}/api/v1/auth/logout-all`, {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) throw new ApiError(res.status, await readErrorMessage(res));
  emitAuthChanged({ user: null });
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const base = getPublicApiBase();
  if (!base) return null;
  let lastError: ApiError | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let res: Response;
    try {
      res = await fetch(`${base}/api/v1/auth/me`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
    } catch {
      lastError = new ApiError(
        0,
        "API 서버에 연결하지 못했습니다. 백엔드(uvicorn)가 켜져 있는지, frontend/.env.local의 NEXT_PUBLIC_API_URL이 실제 포트와 같은지(예: http://localhost:8010) 확인해 주세요.",
      );
      if (attempt === 0) {
        await sleep(400);
        continue;
      }
      throw lastError;
    }
    // Legacy 401 + current 200/{user:null} both mean anonymous.
    if (res.status === 401) return null;
    if (!res.ok) {
      lastError = new ApiError(res.status, await readErrorMessage(res));
      if (attempt === 0 && isRetryableAuthResponseStatus(lastError.status)) {
        await sleep(400);
        continue;
      }
      throw lastError;
    }
    const json = (await res.json()) as MeEnvelope;
    return json.user ?? null;
  }
  throw lastError ?? new ApiError(0, "로그인 상태 확인에 실패했습니다.");
}

export async function checkDisplayNameAvailability(displayName: string): Promise<{ display_name: string; available: boolean }> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const q = new URLSearchParams({ display_name: displayName });
  let lastError: ApiError | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(`${base}/api/v1/auth/display-name-availability?${q.toString()}`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const err = new ApiError(res.status, await readErrorMessage(res));
        if (attempt === 0 && isRetryableAuthResponseStatus(err.status)) {
          lastError = err;
          await sleep(700);
          continue;
        }
        throw err;
      }
      return (await res.json()) as { display_name: string; available: boolean };
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(0, "Network request failed");
      if (attempt === 0 && (apiError.status === 0 || isRetryableAuthResponseStatus(apiError.status))) {
        lastError = apiError;
        await sleep(700);
        continue;
      }
      throw apiError;
    }
  }
  throw lastError ?? new ApiError(0, "Network request failed");
}

export async function updateDisplayName(displayName: string): Promise<AuthUser> {
  return postAuth("/api/v1/auth/display-name", { display_name: displayName });
}

export async function uploadAvatar(file: File): Promise<AuthUser> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${base}/api/v1/auth/avatar`, {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "include",
    body,
  });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  const json = (await res.json()) as AuthEnvelope;
  emitAuthChanged();
  return json.user;
}

export async function clearAvatar(): Promise<AuthUser> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const res = await fetch(`${base}/api/v1/auth/avatar`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  const json = (await res.json()) as AuthEnvelope;
  emitAuthChanged();
  return json.user;
}

export async function changePassword(input: {
  current_password: string;
  new_password: string;
  verification_token: string;
}): Promise<void> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const res = await fetch(`${base}/api/v1/auth/change-password`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
}

export async function sendPasswordChangeCode(): Promise<{
  sent: boolean;
  delivery: string;
  debug_code?: string | null;
}> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const res = await fetch(`${base}/api/v1/auth/change-password-code/send`, {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  return (await res.json()) as { sent: boolean; delivery: string; debug_code?: string | null };
}

export async function verifyPasswordChangeCode(code: string): Promise<{
  verified: boolean;
  verification_token: string;
}> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const res = await fetch(`${base}/api/v1/auth/change-password-code/verify`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  return (await res.json()) as { verified: boolean; verification_token: string };
}

export async function sendAccountDeletionCode(): Promise<{
  sent: boolean;
  delivery: string;
  debug_code?: string | null;
}> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const res = await fetch(`${base}/api/v1/auth/account/deletion-code/send`, {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  return (await res.json()) as { sent: boolean; delivery: string; debug_code?: string | null };
}

export async function verifyAccountDeletionCode(code: string): Promise<{
  verified: boolean;
  verification_token: string;
}> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const res = await fetch(`${base}/api/v1/auth/account/deletion-code/verify`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  return (await res.json()) as { verified: boolean; verification_token: string };
}

export async function deleteAccount(input: { password: string; verification_token: string }): Promise<void> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const res = await fetch(`${base}/api/v1/auth/account/delete`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok && res.status !== 204) throw new ApiError(res.status, await readErrorMessage(res));
  // Phase 4: server cleared auth cookie; notify header immediately.
  // Do not wipe sessionStorage/localStorage (e.g. home.viewed) — unrelated to account.
  emitAuthChanged({ user: null });
}

export async function fetchAccountSecuritySummary(): Promise<AccountSecuritySummary | null> {
  const base = getPublicApiBase();
  if (!base) return null;
  const res = await fetch(`${base}/api/v1/auth/security-summary`, {
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  return (await res.json()) as AccountSecuritySummary;
}

export async function sendSignupEmailCode(email: string): Promise<{ sent: boolean; delivery: string; debug_code?: string | null }> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const res = await fetch(`${base}/api/v1/auth/email-verification/send`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  return (await res.json()) as { sent: boolean; delivery: string; debug_code?: string | null };
}

export async function verifySignupEmailCode(input: { email: string; code: string }): Promise<{ verified: boolean; verification_token: string }> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const res = await fetch(`${base}/api/v1/auth/email-verification/verify`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  return (await res.json()) as { verified: boolean; verification_token: string };
}

export async function requestPasswordReset(email: string): Promise<{ accepted: boolean; delivery: string }> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const res = await fetch(`${base}/api/v1/auth/password-reset/request`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  return (await res.json()) as { accepted: boolean; delivery: string };
}

export async function confirmPasswordReset(input: { token: string; new_password: string }): Promise<void> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const res = await fetch(`${base}/api/v1/auth/password-reset/confirm`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
}

export function subscribeAuthChanged(listener: (detail?: AuthChangedDetail) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<AuthChangedDetail>).detail;
    listener(detail);
  };
  window.addEventListener(AUTH_CHANGED_EVENT, handler);
  return () => window.removeEventListener(AUTH_CHANGED_EVENT, handler);
}

