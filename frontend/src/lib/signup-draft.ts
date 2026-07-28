export const SIGNUP_DRAFT_KEY = "kr_signup_draft_v1";

export type SignupStep = "email" | "password" | "nickname";

export type SignupDraft = {
  email: string;
  emailVerificationToken: string;
};

export function parseSignupStep(raw: string | null | undefined): SignupStep {
  if (raw === "password" || raw === "nickname" || raw === "email") return raw;
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
  if (urlStep === "password" && !draft) return "email";
  if (urlStep === "nickname" && !draft) return "email";
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
    const token =
      typeof parsed.emailVerificationToken === "string" ? parsed.emailVerificationToken.trim() : "";
    if (!email || !token) return null;
    return { email, emailVerificationToken: token };
  } catch {
    return null;
  }
}

export function writeSignupDraft(draft: SignupDraft): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    SIGNUP_DRAFT_KEY,
    JSON.stringify({
      email: draft.email.trim(),
      emailVerificationToken: draft.emailVerificationToken.trim(),
    }),
  );
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
