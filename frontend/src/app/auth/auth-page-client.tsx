"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkDisplayNameAvailability, fetchCurrentUser, login, sendSignupEmailCode, signup, verifySignupEmailCode } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

/** Legacy key stored `{ email, password }`; we only persist `{ email }` now. */
const REMEMBER_SIGNIN_KEY = "kr_saved_signin_credentials_v1";

function friendlyAuthErrorMessage(mode: "login" | "signup", err: unknown): string {
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
      if (raw.includes("password")) return "비밀번호는 8~12자, 영문/숫자/특수문자를 모두 포함해야 합니다.";
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

export function AuthPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
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

  useEffect(() => {
    if (searchParams.get("force") === "1") return;
    let cancelled = false;
    void fetchCurrentUser().then((user) => {
      if (cancelled || !user) return;
      const nextPath = searchParams.get("next");
      const target = nextPath && nextPath.startsWith("/") ? nextPath : "/results";
      router.replace(target);
    });
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

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
    if (!/^[\x21-\x7E]{8,12}$/.test(value)) return false;
    if (!/[A-Za-z]/.test(value)) return false;
    if (!/\d/.test(value)) return false;
    if (!/[^A-Za-z0-9]/.test(value)) return false;
    return true;
  }

  const hasRequiredCharTypes = /[A-Za-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
  const hasValidPasswordLength = password.length >= 8 && password.length <= 12;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "signup") {
        if (!displayNameValidation.valid) {
          setError(displayNameValidation.message);
          return;
        }
        if (!displayNameVerified) {
          setError("닉네임 중복 확인을 먼저 완료해 주세요.");
          return;
        }
        if (!emailVerified || !emailVerificationToken) {
          setError("이메일 인증을 먼저 완료해 주세요.");
          return;
        }
        if (!passwordMatches) {
          setError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
          return;
        }
        if (!isPasswordPolicyValid(password)) {
          setError("비밀번호는 8~12자, 영문/숫자/특수문자를 모두 포함해야 합니다.");
          return;
        }
        await signup({
          email,
          verification_token: emailVerificationToken,
          password,
          display_name: displayName || undefined,
        });
        setInfo("계정이 생성되었습니다. 로그인해 주세요.");
        setMode("login");
        setDisplayNameCheckMessage(null);
        setEmailCode("");
        setEmailCodeSent(false);
        setEmailVerified(false);
        setEmailVerificationToken(null);
        setEmailVerificationMessage(null);
        return;
      } else {
        await login({ email, password });
        if (rememberEmail) {
          window.localStorage.setItem(REMEMBER_SIGNIN_KEY, JSON.stringify({ email }));
        } else {
          window.localStorage.removeItem(REMEMBER_SIGNIN_KEY);
        }
        const nextPath = searchParams.get("next");
        const target = nextPath && nextPath.startsWith("/") ? nextPath : "/results";
        router.push(target);
        router.refresh();
      }
    } catch (err) {
      setError(friendlyAuthErrorMessage(mode, err));
    } finally {
      setBusy(false);
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
      if (err instanceof ApiError && err.status === 404) {
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

  return (
    <div className="mx-auto max-w-lg px-ca-margin-mobile py-10 sm:px-ca-margin">
      <Card className="ca-glass-panel border-ca-outline-variant/40">
        <CardHeader className="border-b-0">
          <p className="font-label text-ca-label-sm font-medium text-ca-secondary">AUTH</p>
          <CardTitle className="font-headline text-ca-on-surface">
            {mode === "login" ? "로그인" : "회원가입"}
          </CardTitle>
          <CardDescription className="text-ca-on-surface-variant">
            {mode === "login"
              ? "계정으로 로그인하고 저장·비교 기능을 이용하세요."
              : "닉네임·이메일 인증 후 계정을 만들 수 있습니다."}
          </CardDescription>
          {mode === "signup" ? (
            <p className="text-xs text-ca-on-surface-variant">
              비밀번호는 8~12자, 영문/숫자/특수문자를 모두 포함해야 합니다.
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === "login" ? "primary" : "outline"}
              onClick={() => setMode("login")}
              className="flex-1 rounded-full"
            >
              로그인
            </Button>
            <Button
              variant={mode === "signup" ? "primary" : "outline"}
              onClick={() => {
                setMode("signup");
                setEmail("");
                setPassword("");
                setConfirmPassword("");
                setRememberEmail(false);
                setEmailCode("");
                setEmailCodeSent(false);
                setEmailVerified(false);
                setEmailVerificationToken(null);
                setEmailVerificationMessage(null);
              }}
              className="flex-1 rounded-full"
            >
              회원가입
            </Button>
          </div>
          <form className="space-y-3" onSubmit={onSubmit}>
            {mode === "signup" ? (
              <div className="space-y-1">
                <Label htmlFor="displayName" className="ca-label">
                  닉네임
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="displayName"
                    className="ca-input"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      setDisplayNameCheckMessage(null);
                      setDisplayNameVerified(false);
                    }}
                    required={mode === "signup"}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 rounded-full"
                    onClick={() => void onCheckDisplayName()}
                    disabled={checkingDisplayName}
                  >
                    {checkingDisplayName ? "확인 중..." : "중복 확인"}
                  </Button>
                </div>
                {displayNameCheckMessage ? (
                  <p className="text-xs text-ca-on-surface-variant">
                    {displayNameCheckMessage}
                    {displayNameVerified ? " (중복 확인 완료)" : ""}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="space-y-1">
              <Label htmlFor="email" className="ca-label">
                이메일
              </Label>
              <Input
                id="email"
                type="email"
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
                disabled={mode === "signup" && !canFillSignupEmail}
              />
            </div>
            {mode === "signup" ? (
              <div className="space-y-1">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 rounded-full"
                    onClick={() => void onSendEmailCode()}
                    disabled={!canFillSignupEmail || sendingEmailCode}
                  >
                    {sendingEmailCode ? "발송 중..." : "인증번호 발송"}
                  </Button>
                  <Input
                    id="emailCode"
                    className="ca-input min-w-[9.5rem] flex-1 text-center sm:min-w-[10.5rem]"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="인증번호 6자리"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={!emailCodeSent || emailVerified}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 rounded-full"
                    onClick={() => void onVerifyEmailCode()}
                    disabled={!emailCodeSent || emailVerified || verifyingEmailCode}
                  >
                    {verifyingEmailCode ? "확인 중..." : emailVerified ? "인증 완료" : "인증 확인"}
                  </Button>
                </div>
                {emailVerificationMessage ? (
                  <p className="text-xs text-ca-on-surface-variant">{emailVerificationMessage}</p>
                ) : (
                  <p className="text-xs text-ca-on-surface-variant">
                    인증번호가 확인되어야 비밀번호 입력이 가능합니다.
                  </p>
                )}
              </div>
            ) : null}
            <div className="space-y-1">
              <Label htmlFor="password" className="ca-label">
                비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  maxLength={12}
                  disabled={mode === "signup" && !canFillSignupCredentials}
                  className="ca-input pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-ca-on-surface-variant hover:text-ca-on-surface"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
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
              {mode === "signup" ? (
                <div className="space-y-1 pt-1 text-xs text-ca-on-surface">
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
                    8~12자
                  </p>
                </div>
              ) : null}
            </div>
            {mode === "signup" ? (
              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="ca-label">
                  비밀번호 확인
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    maxLength={12}
                    disabled={mode === "signup" && !canFillSignupCredentials}
                    className="ca-input pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-ca-on-surface-variant hover:text-ca-on-surface"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "비밀번호 확인 숨기기" : "비밀번호 확인 보기"}
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
                <p className="text-xs text-ca-on-surface">
                  <span className={passwordMatches ? "text-ca-viz-emerald" : "text-destructive"}>
                    {passwordMatches ? "✓" : "✗"}
                  </span>{" "}
                  {passwordMatches ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다."}
                </p>
              </div>
            ) : null}
            {mode === "login" ? (
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs text-ca-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-ca-outline-variant bg-ca-surface-container"
                  />
                  이메일 기억하기
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="font-label text-ca-label-sm font-medium text-ca-primary underline-offset-2 hover:underline"
                >
                  비밀번호 찾기
                </Link>
              </div>
            ) : null}
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            {info ? <p className="text-xs text-ca-viz-emerald">{info}</p> : null}
            <Button type="submit" className="w-full rounded-full" disabled={busy || !canProceedSignup}>
              {busy ? "처리 중..." : mode === "login" ? "로그인" : "계정 만들기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

