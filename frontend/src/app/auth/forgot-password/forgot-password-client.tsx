"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { ManusSurfaceCard } from "@/components/layout/manus-surface-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { FieldValidationError, useKoreanFieldValidation } from "@/lib/use-korean-field-validation";

/** Same copy for smtp / masked / log — never reveal whether the account exists. */
export const PASSWORD_RESET_REQUEST_SUCCESS =
  "입력한 이메일로 가입된 계정이 있다면 재설정 링크를 보내드렸어요.";

export function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailField = useKoreanFieldValidation("email");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
      setMessage(PASSWORD_RESET_REQUEST_SUCCESS);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setError("올바른 이메일 주소를 입력해 주세요.");
      } else if (err instanceof ApiError && !/[가-힣]/.test(err.message)) {
        setError("요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } else {
        setError(err instanceof Error ? err.message : "요청을 처리하지 못했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center bg-[rgb(248_248_252)] px-4 py-10 dark:bg-ca-surface-container-low sm:py-16">
      <div className="w-full max-w-md animate-fade-up">
        <ManusSurfaceCard padding="none">
          <div className="space-y-5 p-8">
            <header className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Keyboard Recommender</p>
              <h1 className="font-headline text-2xl font-extrabold tracking-tight text-ca-on-surface">
                비밀번호 재설정
              </h1>
              <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant">
                가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드려요.
              </p>
            </header>

            <form className="space-y-4" onSubmit={onSubmit} aria-busy={busy || undefined}>
              <div className="space-y-1.5">
                <Label htmlFor="forgot-password-email" className="ca-label">
                  이메일
                </Label>
                <Input
                  id="forgot-password-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  className="ca-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={busy}
                  {...emailField.inputProps}
                />
                <FieldValidationError id={emailField.errorId} message={emailField.error} />
              </div>
              <Button type="submit" className="w-full" loading={busy} disabled={busy}>
                재설정 링크 받기
              </Button>
            </form>

            {submitted && message ? (
              <p
                className="break-keep rounded-lg border border-success/30 bg-success-container px-3 py-2.5 text-sm text-success-on-container dark:border-success/40"
                role="status"
                data-testid="e2e-forgot-password-success"
              >
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="break-keep text-sm text-destructive" role="alert" data-testid="e2e-forgot-password-error">
                {error}
              </p>
            ) : null}

            <Link
              href="/auth?force=1"
              className="inline-flex text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        </ManusSurfaceCard>
      </div>
    </div>
  );
}
