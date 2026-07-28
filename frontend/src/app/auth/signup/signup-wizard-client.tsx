"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SignupStepEmail } from "@/components/auth/signup/signup-step-email";
import { SignupStepNickname } from "@/components/auth/signup/signup-step-nickname";
import { SignupStepPassword } from "@/components/auth/signup/signup-step-password";
import { SignupStepVerify } from "@/components/auth/signup/signup-step-verify";
import { signup } from "@/lib/api/auth";
import { friendlyAuthErrorMessage } from "@/lib/auth-form-helpers";
import { safeAuthNextPath } from "@/lib/auth-next";
import { cn } from "@/lib/utils";
import {
  clearSignupDraft,
  loginAfterSignupHref,
  parseSignupStep,
  readSignupDraft,
  resolveSignupStep,
  signupWizardHref,
  writeSignupDraft,
  type SignupDraft,
  type SignupStep,
} from "@/lib/signup-draft";

const STEP_META: Record<SignupStep, { index: number; title: string; body: string }> = {
  email: { index: 1, title: "이메일 입력", body: "가입에 사용할 이메일을 입력해 주세요." },
  verify: { index: 2, title: "인증번호 확인", body: "이메일로 받은 6자리 인증번호를 입력합니다." },
  password: { index: 3, title: "비밀번호 설정", body: "로그인에 사용할 비밀번호를 만듭니다." },
  nickname: { index: 4, title: "닉네임 설정", body: "다른 사람과 겹치지 않는 닉네임을 정해 주세요." },
};

const STEP_COUNT = 4;

function readSignupSearch(): { step: SignupStep; next: string | null } {
  if (typeof window === "undefined") return { step: "email", next: null };
  const params = new URLSearchParams(window.location.search);
  return { step: parseSignupStep(params.get("step")), next: params.get("next") };
}

function previousStep(step: SignupStep): SignupStep | "login" {
  if (step === "email") return "login";
  if (step === "verify") return "email";
  if (step === "password") return "verify";
  return "password";
}

export function SignupWizardClient() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>("email");
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [draft, setDraft] = useState<SignupDraft | null>(null);
  /** Kept in memory only — never written to sessionStorage. */
  const [password, setPassword] = useState<string | null>(null);
  const [signupBusy, setSignupBusy] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { step: urlStep, next } = readSignupSearch();
    const stored = readSignupDraft();
    setNextPath(next);
    setDraft(stored);

    const resolved = resolveSignupStep({
      urlStep,
      draft: stored,
      hasPassword: Boolean(password),
    });

    setStep(resolved);
    if (resolved !== urlStep) {
      router.replace(signupWizardHref(resolved, next));
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount sync from URL + draft
  }, [router]);

  function goToStep(nextStep: SignupStep) {
    setSignupError(null);
    setStep(nextStep);
    router.push(signupWizardHref(nextStep, nextPath));
  }

  const meta = STEP_META[step];
  const loginHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("mode", "login");
    if (nextPath) params.set("next", nextPath);
    return `/auth?${params.toString()}`;
  }, [nextPath]);

  async function onCreateAccount(displayName: string) {
    if (!draft?.emailVerificationToken || !password) {
      goToStep(draft?.email ? (draft.emailVerificationToken ? "password" : "verify") : "email");
      return;
    }
    setSignupBusy(true);
    setSignupError(null);
    try {
      await signup({
        email: draft.email,
        verification_token: draft.emailVerificationToken,
        password,
        display_name: displayName || undefined,
      });
      clearSignupDraft();
      setPassword(null);
      router.replace(loginAfterSignupHref(nextPath ? safeAuthNextPath(nextPath) : null));
    } catch (err) {
      setSignupError(friendlyAuthErrorMessage("signup", err));
    } finally {
      setSignupBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center bg-[rgb(248_248_252)] px-4 py-10 dark:bg-ca-surface-container-low">
        <p className="text-sm text-ca-on-surface-variant">불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center bg-[rgb(248_248_252)] px-4 py-10 dark:bg-ca-surface-container-low sm:py-16">
      <section className="w-full max-w-md overflow-hidden rounded-md border-2 border-[rgb(220_220_238)] bg-white shadow-sm shadow-primary/5 dark:border-border dark:bg-ca-surface-container dark:shadow-none">
        <div className="space-y-5 p-8">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Keyboard Recommender</p>
            <div className="flex gap-1.5" aria-label={`회원가입 ${meta.index} / ${STEP_COUNT} 단계`}>
              {Array.from({ length: STEP_COUNT }, (_, i) => i + 1).map((n) => (
                <div
                  key={n}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    n <= meta.index ? "bg-primary" : "bg-[rgb(220_220_238)] dark:bg-border",
                  )}
                />
              ))}
            </div>
            <h1 className="font-headline text-2xl font-extrabold tracking-tight text-ca-on-surface">
              {meta.title}
            </h1>
            <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant">{meta.body}</p>
          </header>

          {step === "email" ? (
            <SignupStepEmail
              initialEmail={draft?.email ?? ""}
              onCodeSent={(payload) => {
                const nextDraft: SignupDraft = {
                  email: payload.email,
                  codeSentAt: payload.codeSentAt,
                };
                writeSignupDraft(nextDraft);
                setDraft(nextDraft);
                setPassword(null);
                goToStep("verify");
              }}
            />
          ) : null}

          {step === "verify" && draft?.email ? (
            <SignupStepVerify
              email={draft.email}
              codeSentAt={draft.codeSentAt}
              onCodeResent={(codeSentAt) => {
                const nextDraft: SignupDraft = {
                  email: draft.email,
                  codeSentAt,
                };
                writeSignupDraft(nextDraft);
                setDraft(nextDraft);
              }}
              onChangeEmail={() => {
                writeSignupDraft({ email: draft.email });
                setDraft({ email: draft.email });
                goToStep("email");
              }}
              onVerified={(payload) => {
                const nextDraft: SignupDraft = {
                  email: payload.email,
                  emailVerificationToken: payload.emailVerificationToken,
                  codeSentAt: draft.codeSentAt,
                };
                writeSignupDraft(nextDraft);
                setDraft(nextDraft);
                setPassword(null);
                goToStep("password");
              }}
            />
          ) : null}

          {step === "password" ? (
            <SignupStepPassword
              onContinue={(value) => {
                setPassword(value);
                goToStep("nickname");
              }}
            />
          ) : null}

          {step === "nickname" ? (
            <SignupStepNickname
              onSubmitSignup={onCreateAccount}
              busy={signupBusy}
              formError={signupError}
            />
          ) : null}

          {step === "email" ? (
            <p className="text-center text-sm text-ca-on-surface-variant">
              이미 계정이 있나요?{" "}
              <Link
                href={loginHref}
                prefetch={false}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                로그인
              </Link>
            </p>
          ) : (
            <div className="flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                className="font-medium text-ca-on-surface-variant underline-offset-2 hover:text-ca-on-surface hover:underline"
                onClick={() => {
                  const prev = previousStep(step);
                  if (prev === "login") {
                    router.push(loginHref);
                    return;
                  }
                  goToStep(prev);
                }}
              >
                이전
              </button>
              <p className="text-right text-ca-on-surface-variant">
                이미 계정이 있나요?{" "}
                <Link
                  href={loginHref}
                  prefetch={false}
                  className="font-semibold text-primary underline-offset-2 hover:underline"
                >
                  로그인
                </Link>
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
