"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { PasswordVisibilityToggle } from "@/components/auth/password-visibility-toggle";
import { useAuthHeader } from "@/components/layout/auth-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchCurrentUser, login } from "@/lib/api/auth";
import { friendlyAuthErrorMessage } from "@/lib/auth-form-helpers";
import {
  authEntryContext,
  authLoginContextCopy,
  safeAuthNextPath,
} from "@/lib/auth-next";
import { FieldValidationError, useKoreanFieldValidation } from "@/lib/use-korean-field-validation";
import { signupWizardHref } from "@/lib/signup-draft";

/** Legacy key stored `{ email, password }`; we only persist `{ email }` now. */
const REMEMBER_SIGNIN_KEY = "kr_saved_signin_credentials_v1";

export { friendlyAuthErrorMessage } from "@/lib/auth-form-helpers";

/** Read auth query params without ``useSearchParams`` (avoids Suspense SSR fallback). */
function readAuthSearchParams(): {
  force: boolean;
  next: string | null;
  mode: "login" | "signup" | null;
  signupComplete: boolean;
} {
  if (typeof window === "undefined") {
    return { force: false, next: null, mode: null, signupComplete: false };
  }
  const params = new URLSearchParams(window.location.search);
  const rawMode = params.get("mode");
  const mode = rawMode === "signup" || rawMode === "login" ? rawMode : null;
  return {
    force: params.get("force") === "1",
    next: params.get("next"),
    mode,
    signupComplete: params.get("signup") === "1",
  };
}

export function AuthPageClient() {
  const router = useRouter();
  const { setUser } = useAuthHeader();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authNextPath, setAuthNextPath] = useState<string | null>(null);

  const emailField = useKoreanFieldValidation("email");
  const passwordField = useKoreanFieldValidation("password");
  const loginRequestGen = useRef(0);

  useEffect(() => {
    const { force, next, mode, signupComplete } = readAuthSearchParams();
    setAuthNextPath(next);
    if (signupComplete) {
      setLoginNotice("계정이 생성되었습니다. 로그인해 주세요.");
    }
    if (mode === "signup") {
      router.replace(signupWizardHref("email", next));
      return;
    }
    if (force) return;
    let cancelled = false;
    void fetchCurrentUser().then((user) => {
      if (cancelled || !user) return;
      router.replace(safeAuthNextPath(next));
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const raw = window.localStorage.getItem(REMEMBER_SIGNIN_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { email?: string; password?: string };
      if (parsed.email) {
        setEmail(parsed.email);
        setRememberEmail(true);
      }
      if (parsed.password) {
        if (parsed.email) {
          window.localStorage.setItem(REMEMBER_SIGNIN_KEY, JSON.stringify({ email: parsed.email }));
        } else {
          window.localStorage.removeItem(REMEMBER_SIGNIN_KEY);
        }
      }
    } catch {
      // ignore malformed local storage content
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const requestId = ++loginRequestGen.current;
    setLoginBusy(true);
    setLoginError(null);
    setLoginNotice(null);
    try {
      const loggedIn = await login({ email, password });
      if (requestId !== loginRequestGen.current) return;
      if (rememberEmail) {
        window.localStorage.setItem(REMEMBER_SIGNIN_KEY, JSON.stringify({ email }));
      } else {
        window.localStorage.removeItem(REMEMBER_SIGNIN_KEY);
      }
      setUser(loggedIn);
      const { next } = readAuthSearchParams();
      router.replace(safeAuthNextPath(next));
    } catch (err) {
      if (requestId !== loginRequestGen.current) return;
      setLoginError(friendlyAuthErrorMessage("login", err));
    } finally {
      setLoginBusy(false);
    }
  }

  const loginCtx = authEntryContext(authNextPath);
  const loginCopy = authLoginContextCopy(loginCtx);
  const signupHref = signupWizardHref("email", authNextPath);

  return (
    <div className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center bg-[rgb(248_248_252)] px-4 py-10 dark:bg-ca-surface-container-low sm:py-16">
      <section className="w-full max-w-md overflow-hidden rounded-md border-2 border-[rgb(220_220_238)] bg-white shadow-sm shadow-primary/5 dark:border-border dark:bg-ca-surface-container dark:shadow-none">
        <div className="space-y-5 p-8">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Keyboard Recommender</p>
            <h1 className="font-headline text-2xl font-extrabold tracking-tight text-ca-on-surface">
              {loginCopy.title}
            </h1>
            <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant">{loginCopy.body}</p>
            {loginCopy.benefits?.length ? (
              <ul className="mt-2 space-y-1 text-sm text-ca-on-surface-variant">
                {loginCopy.benefits.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span aria-hidden>·</span>
                    <span className="break-keep">{line}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </header>

          <form className="space-y-4" onSubmit={onSubmit} aria-busy={loginBusy || undefined}>
            <div className="space-y-2">
              <Label htmlFor="email" className="ca-label">
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                className="ca-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loginBusy}
                {...emailField.inputProps}
              />
              <FieldValidationError id={emailField.errorId} message={emailField.error} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="ca-label">
                비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  maxLength={20}
                  disabled={loginBusy}
                  className="ca-input pr-10"
                  {...passwordField.inputProps}
                />
                <PasswordVisibilityToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  disabled={loginBusy}
                />
              </div>
              <FieldValidationError id={passwordField.errorId} message={passwordField.error} />
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-ca-on-surface-variant">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => setRememberEmail(e.target.checked)}
                  disabled={loginBusy}
                  className="h-4 w-4 rounded border-ca-outline-variant bg-ca-surface-container"
                />
                이메일 기억하기
              </label>
              <Link
                href="/auth/forgot-password"
                prefetch={false}
                className="text-sm font-medium text-ca-primary underline-offset-2 hover:underline"
                aria-disabled={loginBusy || undefined}
                tabIndex={loginBusy ? -1 : undefined}
              >
                비밀번호 찾기
              </Link>
            </div>

            {loginError ? (
              <p className="break-keep text-sm text-destructive" role="alert" data-testid="e2e-auth-error">
                {loginError}
              </p>
            ) : null}
            {loginNotice ? (
              <p className="break-keep text-sm text-ca-viz-emerald" data-testid="e2e-auth-login-notice">
                {loginNotice}
              </p>
            ) : null}

            <Button type="submit" className="w-full" loading={loginBusy} data-testid="e2e-auth-submit">
              로그인
            </Button>
          </form>

          <p className="text-center text-sm text-ca-on-surface-variant">
            계정이 없나요?{" "}
            <Link
              href={signupHref}
              prefetch={false}
              className="font-semibold text-primary underline-offset-2 hover:underline"
              data-testid="e2e-auth-tab-signup"
            >
              계정 만들기
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
