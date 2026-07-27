"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
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
    <div className="mx-auto w-full max-w-md overflow-x-hidden px-ca-margin-mobile py-10 sm:px-ca-margin">
      <Card className="ca-glass-panel border-ca-outline-variant/40">
        <CardHeader className="border-b-0 space-y-2">
          <p className="font-label text-ca-label-sm font-medium text-ca-secondary">AUTH</p>
          <h1 className="font-headline text-lg font-semibold tracking-tight text-ca-on-surface sm:text-xl">
            비밀번호 재설정
          </h1>
          <CardDescription className="text-ca-on-surface-variant">
            가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드려요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={onSubmit} aria-busy={busy || undefined}>
            <div className="space-y-1">
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
            <p className="break-keep text-sm text-ca-viz-emerald" role="status" data-testid="e2e-forgot-password-success">
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
            className="inline-block text-sm font-medium text-ca-primary underline-offset-2 hover:underline"
          >
            로그인으로 돌아가기
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
