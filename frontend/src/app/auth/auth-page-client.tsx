"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { useAuthHeader } from "@/components/layout/auth-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkDisplayNameAvailability, fetchCurrentUser, login, sendSignupEmailCode, signup, verifySignupEmailCode } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import {
  authEntryContext,
  authLoginContextCopy,
  safeAuthNextPath,
} from "@/lib/auth-next";
import { syncPasswordMatchValidity } from "@/lib/form-validation-ko";
import { FieldValidationError, useKoreanFieldValidation } from "@/lib/use-korean-field-validation";
/** Legacy key stored `{ email, password }`; we only persist `{ email }` now. */
const REMEMBER_SIGNIN_KEY = "kr_saved_signin_credentials_v1";

export function friendlyAuthErrorMessage(mode: "login" | "signup", err: unknown): string {
  if (!(err instanceof ApiError)) {
    return "네트워크 연결을 확인하고 다시 시도해 주세요.";
  }
  const raw = (err.message || "").toLowerCase();
  if (mode === "signup") {
    if (err.status === 409 || raw.includes("already exists")) {
      return "이미 가입된 이메일입니다.";
    }
    if (raw.includes("email verification")) {
      return "이메일 인증을 먼저 완료해 주세요.";
    }
    if (raw.includes("verification code")) {
      return "인증번호를 다시 확인해 주세요.";
    }
    if (err.status === 422) {
      if (raw.includes("password")) return "비밀번호는 8~20자, 영문/숫자/특수문자를 모두 포함해야 합니다.";
      if (raw.includes("email")) return "이메일 형식을 확인해 주세요.";
      return "입력값을 다시 확인해 주세요.";
    }
  }
  if (mode === "login") {
    if (err.status === 401 || raw.includes("invalid email or password")) {
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    }
    if (err.status === 422) return "이메일/비밀번호 형식을 확인해 주세요.";
  }
  if (err.status >= 500) return "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  return err.message || "요청을 처리하지 못했습니다. 다시 시도해 주세요.";
}

function isRetryableDisplayNameCheckError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504);
}

/** Read auth query params without ``useSearchParams`` (avoids Suspense SSR fallback). */
function readAuthSearchParams(): {
  force: boolean;
  next: string | null;
  mode: "login" | "signup" | null;
} {
  if (typeof window === "undefined") return { force: false, next: null, mode: null };
  const params = new URLSearchParams(window.location.search);
  const rawMode = params.get("mode");
  const mode = rawMode === "signup" || rawMode === "login" ? rawMode : null;
  return { force: params.get("force") === "1", next: params.get("next"), mode };
}

export function AuthPageClient() {
  const router = useRouter();
  const { setUser } = useAuthHeader();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const modeRef = useRef(mode);
  modeRef.current = mode;
  /** Bumps on tab switch so abandoned auth responses do not paint the wrong tab. */
  const authRequestGen = useRef(0);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [signupBusy, setSignupBusy] = useState(false);
  /** Signup success notice shown on the login tab only. */
  const [loginNotice, setLoginNotice] = useState<string | null>(null);

  const [displayNameCheckMessage, setDisplayNameCheckMessage] = useState<string | null>(null);
  const [checkingDisplayName, setCheckingDisplayName] = useState(false);
  const [displayNameVerified, setDisplayNameVerified] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState<string | null>(null);
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [verifyingEmailCode, setVerifyingEmailCode] = useState(false);
  const [authNextPath, setAuthNextPath] = useState<string | null>(null);

  const displayNameField = useKoreanFieldValidation("displayName");
  const emailField = useKoreanFieldValidation("email");
  const passwordField = useKoreanFieldValidation("password");
  const confirmPasswordField = useKoreanFieldValidation("confirmPassword");
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement | null>(null);

  const formBusy = mode === "login" ? loginBusy : signupBusy;
  const activeError = mode === "login" ? loginError : signupError;

  useEffect(() => {
    const { force, next, mode: queryMode } = readAuthSearchParams();
    setAuthNextPath(next);
    if (queryMode) setMode(queryMode);
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

  function validateDisplayName(value: string): { valid: boolean; message: string } {
    const v = value.trim();
    if (!v) return { valid: false, message: "닉네임을 먼저 입력해 주세요." };
    const hasHangul = /[가-힣]/.test(v);
    const hasLatin = /[A-Za-z]/.test(v);
    if (hasHangul && !hasLatin && v.length < 2) {
      return { valid: false, message: "한국어 닉네임은 2자 이상이어야 합니다." };
    }
    if (hasLatin && !hasHangul && v.length < 3) {
      return { valid: false, message: "영어 닉네임은 3자 이상이어야 합니다." };
    }
    if (v.length < 3 && (hasHangul || hasLatin)) {
      return { valid: false, message: "닉네임은 3자 이상이어야 합니다." };
    }
    return { valid: true, message: "" };
  }

  const displayNameValidation = validateDisplayName(displayName);
  const passwordMatches = confirmPassword.length > 0 && password === confirmPassword;
  const canFillSignupEmail = mode !== "signup" || (displayNameValidation.valid && displayNameVerified);
  const canFillSignupCredentials = mode !== "signup" || (canFillSignupEmail && emailVerified);
  const canProceedSignup = mode !== "signup" || (canFillSignupCredentials && passwordMatches && isPasswordPolicyValid(password));

  function isPasswordPolicyValid(value: string): boolean {
    if (!/^[\x21-\x7E]{8,20}$/.test(value)) return false;
    if (!/[A-Za-z]/.test(value)) return false;
    if (!/\d/.test(value)) return false;
    if (!/[^A-Za-z0-9]/.test(value)) return false;
    return true;
  }

  const hasRequiredCharTypes = /[A-Za-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
  const hasValidPasswordLength = password.length >= 8 && password.length <= 20;

  function switchToLogin() {
    authRequestGen.current += 1;
    setMode("login");
    setSignupError(null);
    setSignupBusy(false);
    displayNameField.setError(null);
    emailField.setError(null);
    passwordField.setError(null);
    confirmPasswordField.setError(null);
    // Keep loginNotice (e.g. after successful signup).
  }

  function switchToSignup() {
    authRequestGen.current += 1;
    setMode("signup");
    setLoginError(null);
    setLoginNotice(null);
    setLoginBusy(false);
    displayNameField.setError(null);
    emailField.setError(null);
    passwordField.setError(null);
    confirmPasswordField.setError(null);
    // Existing policy: clear credentials when entering signup from login.
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRememberEmail(false);
    setEmailCode("");
    setEmailCodeSent(false);
    setEmailVerified(false);
    setEmailVerificationToken(null);
    setEmailVerificationMessage(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const submitMode = mode;
    const requestId = ++authRequestGen.current;

    if (submitMode === "signup") {
      syncPasswordMatchValidity(passwordInputRef.current, confirmPasswordInputRef.current);
      if (confirmPasswordInputRef.current && !confirmPasswordInputRef.current.checkValidity()) {
        confirmPasswordInputRef.current.reportValidity();
        return;
      }
    }

    if (submitMode === "login") {
      setLoginBusy(true);
      setLoginError(null);
      setLoginNotice(null);
    } else {
      setSignupBusy(true);
      setSignupError(null);
    }

    const stillCurrent = () =>
      requestId === authRequestGen.current && modeRef.current === submitMode;

    try {
      if (submitMode === "signup") {
        if (!displayNameValidation.valid) {
          if (stillCurrent()) setSignupError(displayNameValidation.message);
          return;
        }
        if (!displayNameVerified) {
          if (stillCurrent()) setSignupError("닉네임 중복 확인을 먼저 완료해 주세요.");
          return;
        }
        if (!emailVerified || !emailVerificationToken) {
          if (stillCurrent()) setSignupError("이메일 인증을 먼저 완료해 주세요.");
          return;
        }
        if (!passwordMatches) {
          if (stillCurrent()) setSignupError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
          return;
        }
        if (!isPasswordPolicyValid(password)) {
          if (stillCurrent()) {
            setSignupError("비밀번호는 8~20자, 영문/숫자/특수문자를 모두 포함해야 합니다.");
          }
          return;
        }
        await signup({
          email,
          verification_token: emailVerificationToken,
          password,
          display_name: displayName || undefined,
        });
        if (requestId !== authRequestGen.current) return;
        setSignupError(null);
        setLoginNotice("계정이 생성되었습니다. 로그인해 주세요.");
        setMode("login");
        setDisplayNameCheckMessage(null);
        setEmailCode("");
        setEmailCodeSent(false);
        setEmailVerified(false);
        setEmailVerificationToken(null);
        setEmailVerificationMessage(null);
        return;
      }

      const loggedIn = await login({ email, password });
      if (requestId !== authRequestGen.current) return;
      if (modeRef.current !== "login") return;
      if (rememberEmail) {
        window.localStorage.setItem(REMEMBER_SIGNIN_KEY, JSON.stringify({ email }));
      } else {
        window.localStorage.removeItem(REMEMBER_SIGNIN_KEY);
      }
      // Keep the login response in header state. A stale in-flight /me must not
      // clear it (AuthHeaderProvider generation guard); soft nav keeps that state.
      setUser(loggedIn);
      const { next } = readAuthSearchParams();
      router.replace(safeAuthNextPath(next));
    } catch (err) {
      if (!stillCurrent()) return;
      const message = friendlyAuthErrorMessage(submitMode, err);
      if (submitMode === "login") setLoginError(message);
      else setSignupError(message);
    } finally {
      if (submitMode === "login") setLoginBusy(false);
      else setSignupBusy(false);
    }
  }

  async function onCheckDisplayName() {
    const value = displayName.trim();
    setDisplayNameCheckMessage(null);
    setDisplayNameVerified(false);
    if (!displayNameValidation.valid) {
      setDisplayNameCheckMessage(displayNameValidation.message);
      return;
    }
    setCheckingDisplayName(true);
    try {
      const res = await checkDisplayNameAvailability(value);
      if (res.available) {
        setDisplayNameCheckMessage("사용 가능한 닉네임입니다.");
        setDisplayNameVerified(true);
      } else {
        setDisplayNameCheckMessage("이미 사용중입니다.");
      }
    } catch (err) {
      if (isRetryableDisplayNameCheckError(err) || (err instanceof ApiError && err.status === 404)) {
        setDisplayNameCheckMessage("지금은 중복 확인이 어렵습니다. 잠시 후 다시 시도해 주세요.");
      } else if (err instanceof ApiError && err.status === 422) {
        setDisplayNameCheckMessage("닉네임 형식을 확인해 주세요.");
      } else {
        setDisplayNameCheckMessage(err instanceof Error ? err.message : "중복 확인에 실패했습니다.");
      }
    } finally {
      setCheckingDisplayName(false);
    }
  }

  async function onSendEmailCode() {
    const trimmed = email.trim();
    setEmailVerificationMessage(null);
    setEmailVerified(false);
    setEmailVerificationToken(null);
    if (!trimmed) {
      setEmailVerificationMessage("이메일을 먼저 입력해 주세요.");
      return;
    }
    setSendingEmailCode(true);
    try {
      const res = await sendSignupEmailCode(trimmed);
      setEmailCodeSent(true);
      if (res.delivery === "smtp") {
        setEmailVerificationMessage("인증번호를 이메일로 보냈습니다.");
      } else {
        setEmailVerificationMessage("인증번호 요청이 접수되었습니다. 메일 도착까지 잠시 기다려 주세요.");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setEmailVerificationMessage("이메일 형식을 확인해 주세요.");
      } else {
        setEmailVerificationMessage(err instanceof Error ? err.message : "인증번호 발송에 실패했습니다.");
      }
    } finally {
      setSendingEmailCode(false);
    }
  }

  async function onVerifyEmailCode() {
    const trimmed = email.trim();
    const code = emailCode.trim();
    setEmailVerificationMessage(null);
    setEmailVerified(false);
    setEmailVerificationToken(null);
    if (!trimmed || !emailCodeSent) {
      setEmailVerificationMessage("먼저 인증번호를 발송해 주세요.");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setEmailVerificationMessage("인증번호 6자리를 입력해 주세요.");
      return;
    }
    setVerifyingEmailCode(true);
    try {
      const res = await verifySignupEmailCode({ email: trimmed, code });
      setEmailVerified(res.verified);
      setEmailVerificationToken(res.verification_token);
      setEmailVerificationMessage("이메일 인증이 완료되었습니다.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setEmailVerificationMessage("인증번호가 올바르지 않거나 만료되었습니다.");
      } else {
        setEmailVerificationMessage(err instanceof Error ? err.message : "인증 확인에 실패했습니다.");
      }
    } finally {
      setVerifyingEmailCode(false);
    }
  }

  const loginCtx = authEntryContext(authNextPath);
  const loginCopy = authLoginContextCopy(loginCtx);
  const tabIdleClass =
    "h-10 flex-1 rounded-lg border-ca-outline-variant/50 bg-transparent text-ca-on-surface-variant hover:border-ca-on-surface/30 hover:bg-ca-surface-container/50 hover:text-ca-on-surface";
  const tabActiveClass = "h-10 flex-1 rounded-lg";

  return (
    <div className="mx-auto w-full max-w-md px-ca-margin-mobile py-10 sm:px-ca-margin sm:py-16">
      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-lg shadow-indigo-100/60 dark:bg-ca-surface-container dark:shadow-none">
        <header className="space-y-2 border-b border-border px-5 py-6 sm:px-6 sm:py-7">
          <p className="section-label">Keyboard Recommender</p>
          <h1 className="font-headline text-2xl font-extrabold tracking-tight text-ca-on-surface">
            {mode === "login" ? loginCopy.title : "회원가입"}
          </h1>
          <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant">
            {mode === "login"
              ? loginCopy.body
              : "닉네임과 이메일 인증 후 계정을 만듭니다."}
          </p>
          {mode === "login" && loginCopy.benefits?.length ? (
            <ul className="mt-2 space-y-1 text-sm text-ca-on-surface-variant">
              {loginCopy.benefits.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden>·</span>
                  <span className="break-keep">{line}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {mode === "signup" ? (
            <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant">
              비밀번호는 8~20자, 영문·숫자·특수문자를 모두 포함해야 합니다.
            </p>
          ) : null}
        </header>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex gap-2" role="tablist" aria-label="로그인 또는 회원가입">
            <Button
              variant={mode === "login" ? "primary" : "outline"}
              onClick={switchToLogin}
              className={mode === "login" ? tabActiveClass : tabIdleClass}
              role="tab"
              aria-selected={mode === "login"}
              data-testid="e2e-auth-tab-login"
            >
              로그인
            </Button>
            <Button
              variant={mode === "signup" ? "primary" : "outline"}
              onClick={switchToSignup}
              className={mode === "signup" ? tabActiveClass : tabIdleClass}
              role="tab"
              aria-selected={mode === "signup"}
              data-testid="e2e-auth-tab-signup"
            >
              회원가입
            </Button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit} aria-busy={formBusy || undefined}>
            {mode === "signup" ? (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="ca-label">
                  닉네임
                </Label>
                <div className="flex min-w-0 gap-2">
                  <Input
                    id="displayName"
                    className="ca-input min-w-0 flex-1"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      setDisplayNameCheckMessage(null);
                      setDisplayNameVerified(false);
                    }}
                    required={mode === "signup"}
                    disabled={formBusy || checkingDisplayName}
                    {...displayNameField.inputProps}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="min-w-[5.5rem] shrink-0"
                    onClick={() => void onCheckDisplayName()}
                    loading={checkingDisplayName}
                    disabled={formBusy}
                  >
                    중복 확인
                  </Button>
                </div>
                <FieldValidationError id={displayNameField.errorId} message={displayNameField.error} />
                {displayNameCheckMessage ? (
                  <p className="text-sm text-ca-on-surface-variant">
                    {displayNameCheckMessage}
                    {displayNameVerified ? " (중복 확인 완료)" : ""}
                  </p>
                ) : null}
              </div>
            ) : null}

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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (mode === "signup") {
                    setEmailCode("");
                    setEmailCodeSent(false);
                    setEmailVerified(false);
                    setEmailVerificationToken(null);
                    setEmailVerificationMessage(null);
                  }
                }}
                required
                disabled={formBusy || (mode === "signup" && !canFillSignupEmail)}
                {...emailField.inputProps}
              />
              <FieldValidationError id={emailField.errorId} message={emailField.error} />
            </div>

            {mode === "signup" ? (
              <div className="space-y-2">
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => void onSendEmailCode()}
                    loading={sendingEmailCode}
                    disabled={!canFillSignupEmail || formBusy || verifyingEmailCode}
                  >
                    인증번호 발송
                  </Button>
                  <div className="flex min-w-0 flex-col gap-2">
                    <Label htmlFor="emailCode" className="ca-label">
                      이메일 인증번호
                    </Label>
                    <div className="flex min-w-0 items-center gap-2">
                    <Input
                      id="emailCode"
                      className="ca-input min-w-0 flex-1 text-center"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6자리 숫자"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      disabled={formBusy || !emailCodeSent || emailVerified || verifyingEmailCode}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="min-w-[5.5rem] shrink-0"
                      onClick={() => void onVerifyEmailCode()}
                      loading={verifyingEmailCode}
                      disabled={!emailCodeSent || emailVerified || formBusy || sendingEmailCode}
                    >
                      {emailVerified ? "인증 완료" : "인증 확인"}
                    </Button>
                    </div>
                  </div>
                </div>
                {emailVerificationMessage ? (
                  <p className="text-sm text-ca-on-surface-variant">{emailVerificationMessage}</p>
                ) : (
                  <p className="break-keep text-sm text-ca-on-surface-variant">
                    인증번호가 확인되어야 비밀번호 입력이 가능합니다.
                  </p>
                )}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="password" className="ca-label">
                비밀번호
              </Label>
              <div className="relative">
                <Input
                  ref={passwordInputRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    syncPasswordMatchValidity(e.currentTarget, confirmPasswordInputRef.current);
                  }}
                  required
                  minLength={8}
                  maxLength={20}
                  disabled={formBusy || (mode === "signup" && !canFillSignupCredentials)}
                  className="ca-input pr-10"
                  {...passwordField.inputProps}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-ca-on-surface-variant hover:text-ca-on-surface"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  disabled={formBusy}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M3 3l18 18" />
                      <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
                      <path d="M9.88 5.09A9.77 9.77 0 0 1 12 4c5 0 9.27 3.11 11 8a11.8 11.8 0 0 1-3.17 4.59" />
                      <path d="M6.61 6.61A11.8 11.8 0 0 0 1 12c1.04 2.94 3.1 5.2 5.74 6.46" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </Button>
              </div>
              <FieldValidationError id={passwordField.errorId} message={passwordField.error} />
              {mode === "signup" ? (
                <div className="space-y-1 pt-1 text-sm text-ca-on-surface-variant">
                  <p>
                    <span className={hasRequiredCharTypes ? "text-ca-viz-emerald" : "text-destructive"}>
                      {hasRequiredCharTypes ? "✓" : "✗"}
                    </span>{" "}
                    영어/숫자/특수기호 포함
                  </p>
                  <p>
                    <span className={hasValidPasswordLength ? "text-ca-viz-emerald" : "text-destructive"}>
                      {hasValidPasswordLength ? "✓" : "✗"}
                    </span>{" "}
                    8~20자
                  </p>
                </div>
              ) : null}
            </div>

            {mode === "signup" ? (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="ca-label">
                  비밀번호 확인
                </Label>
                <div className="relative">
                  <Input
                    ref={confirmPasswordInputRef}
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      syncPasswordMatchValidity(passwordInputRef.current, e.currentTarget);
                    }}
                    required
                    minLength={8}
                    maxLength={20}
                    disabled={formBusy || (mode === "signup" && !canFillSignupCredentials)}
                    className="ca-input pr-10"
                    {...confirmPasswordField.inputProps}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-ca-on-surface-variant hover:text-ca-on-surface"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "비밀번호 확인 숨기기" : "비밀번호 확인 보기"}
                    disabled={formBusy}
                  >
                    {showConfirmPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
                        <path d="M9.88 5.09A9.77 9.77 0 0 1 12 4c5 0 9.27 3.11 11 8a11.8 11.8 0 0 1-3.17 4.59" />
                        <path d="M6.61 6.61A11.8 11.8 0 0 0 1 12c1.04 2.94 3.1 5.2 5.74 6.46" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </Button>
                </div>
                <FieldValidationError id={confirmPasswordField.errorId} message={confirmPasswordField.error} />
                <p className="text-sm text-ca-on-surface-variant">
                  <span className={passwordMatches ? "text-ca-viz-emerald" : "text-destructive"}>
                    {passwordMatches ? "✓" : "✗"}
                  </span>{" "}
                  {passwordMatches ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다."}
                </p>
              </div>
            ) : null}

            {mode === "login" ? (
              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-ca-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                    disabled={formBusy}
                    className="h-4 w-4 rounded border-ca-outline-variant bg-ca-surface-container"
                  />
                  이메일 기억하기
                </label>
                <Link
                  href="/auth/forgot-password"
                  prefetch={false}
                  className="text-sm font-medium text-ca-primary underline-offset-2 hover:underline"
                  aria-disabled={formBusy || undefined}
                  tabIndex={formBusy ? -1 : undefined}
                >
                  비밀번호 찾기
                </Link>
              </div>
            ) : null}

            {activeError ? (
              <p className="break-keep text-sm text-destructive" role="alert" data-testid="e2e-auth-error">
                {activeError}
              </p>
            ) : null}
            {mode === "login" && loginNotice ? (
              <p className="break-keep text-sm text-ca-viz-emerald" data-testid="e2e-auth-login-notice">
                {loginNotice}
              </p>
            ) : null}

            {mode === "signup" ? (
              <p className="break-keep text-center text-xs leading-relaxed text-ca-on-surface-variant">
                계정을 만들면{" "}
                <Link href="/terms" prefetch={false} className="underline underline-offset-2 hover:text-ca-on-surface">
                  이용약관
                </Link>
                과{" "}
                <Link href="/privacy" prefetch={false} className="underline underline-offset-2 hover:text-ca-on-surface">
                  개인정보처리방침
                </Link>
                에 동의하는 것으로 간주합니다.
              </p>
            ) : null}

            <Button type="submit" className="w-full" loading={formBusy} disabled={!canProceedSignup} data-testid="e2e-auth-submit">
              {mode === "login" ? "로그인" : "계정 만들기"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
