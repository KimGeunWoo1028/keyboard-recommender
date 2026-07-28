export const SIGNUP_DRAFT_KEY = "kr_signup_draft_v1";

export type SignupStep = "email" | "verify" | "password" | "nickname";

/** Pending email after send; token appears only after OTP verify. */
export type SignupDraft = {
  email: string;
  emailVerificationToken?: string;
  /** Epoch ms when the last code was sent — drives resend cooldown UI. */
  codeSentAt?: number;
};

export const SIGNUP_RESEND_COOLDOWN_SEC = 10;

export function parseSignupStep(raw: string | null | undefined): SignupStep {
  if (raw === "verify" || raw === "password" || raw === "nickname" || raw === "email") return raw;
  return "email";
}

/**
 * Resolve the effective wizard step from URL + draft + in-memory password.
 * Password is never persisted; refresh on nickname falls back to password.
 */
export function resolveSignupStep(opts: {
  urlStep: SignupStep;
  draft: SignupDraft | null;
  hasPassword: boolean;
}): SignupStep {
  const { urlStep, draft, hasPassword } = opts;
  const hasEmail = Boolean(draft?.email);
  const hasToken = Boolean(draft?.emailVerificationToken);

  if (urlStep === "verify" && !hasEmail) return "email";
  if (urlStep === "password" && !hasToken) return hasEmail ? "verify" : "email";
  if (urlStep === "nickname" && !hasToken) return hasEmail ? "verify" : "email";
  if (urlStep === "nickname" && !hasPassword) return "password";
  return urlStep;
}

export function readSignupDraft(): SignupDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SIGNUP_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SignupDraft>;
    const email = typeof parsed.email === "string" ? parsed.email.trim() : "";
    if (!email) return null;
    const token =
      typeof parsed.emailVerificationToken === "string" ? parsed.emailVerificationToken.trim() : "";
    const codeSentAt =
      typeof parsed.codeSentAt === "number" && Number.isFinite(parsed.codeSentAt)
        ? parsed.codeSentAt
        : undefined;
    return {
      email,
      ...(token ? { emailVerificationToken: token } : {}),
      ...(codeSentAt != null ? { codeSentAt } : {}),
    };
  } catch {
    return null;
  }
}

export function writeSignupDraft(draft: SignupDraft): void {
  if (typeof window === "undefined") return;
  const payload: SignupDraft = {
    email: draft.email.trim(),
  };
  if (draft.emailVerificationToken?.trim()) {
    payload.emailVerificationToken = draft.emailVerificationToken.trim();
  }
  if (typeof draft.codeSentAt === "number") {
    payload.codeSentAt = draft.codeSentAt;
  }
  window.sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(payload));
}

export function clearSignupDraft(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
}

/** Build signup wizard URL with optional next path. */
export function signupWizardHref(step: SignupStep, next?: string | null): string {
  const params = new URLSearchParams();
  params.set("step", step);
  if (next && next.startsWith("/")) params.set("next", next);
  return `/auth/signup?${params.toString()}`;
}

export function loginAfterSignupHref(next?: string | null): string {
  const params = new URLSearchParams();
  params.set("mode", "login");
  params.set("signup", "1");
  if (next && next.startsWith("/")) params.set("next", next);
  return `/auth?${params.toString()}`;
}

export function resendCooldownRemaining(codeSentAt: number | undefined, now = Date.now()): number {
  if (codeSentAt == null) return 0;
  const elapsed = Math.floor((now - codeSentAt) / 1000);
  return Math.max(0, SIGNUP_RESEND_COOLDOWN_SEC - elapsed);
}

export function formatCooldownMmSs(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
