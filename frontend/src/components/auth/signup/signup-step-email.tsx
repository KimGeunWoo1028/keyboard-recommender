"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendSignupEmailCode } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { FieldValidationError, useKoreanFieldValidation } from "@/lib/use-korean-field-validation";

type Props = {
  initialEmail?: string;
  onCodeSent: (payload: { email: string; codeSentAt: number }) => void;
  busy?: boolean;
};

export function SignupStepEmail({ initialEmail = "", onCodeSent, busy = false }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const emailField = useKoreanFieldValidation("email");

  async function onSendCode() {
    const trimmed = email.trim();
    setMessage(null);
    if (!trimmed) {
      setMessage("이메일을 먼저 입력해 주세요.");
      return;
    }
    setSending(true);
    try {
      const res = await sendSignupEmailCode(trimmed);
      setMessage(
        res.delivery === "smtp"
          ? "인증번호를 이메일로 보냈습니다."
          : "인증번호 요청이 접수되었습니다. 메일 도착까지 잠시 기다려 주세요.",
      );
      onCodeSent({ email: trimmed, codeSentAt: Date.now() });
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setMessage("이메일 형식을 확인해 주세요.");
      } else {
        setMessage(err instanceof Error ? err.message : "인증번호 발송에 실패했습니다.");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4" data-testid="e2e-signup-step-email">
      <div className="space-y-2">
        <Label htmlFor="signup-email" className="ca-label">
          이메일
        </Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          className="ca-input"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setMessage(null);
          }}
          required
          disabled={busy || sending}
          {...emailField.inputProps}
        />
        <FieldValidationError id={emailField.errorId} message={emailField.error} />
      </div>

      {message ? <p className="text-sm text-ca-on-surface-variant">{message}</p> : null}

      <Button
        type="button"
        className="w-full"
        onClick={() => void onSendCode()}
        loading={sending}
        disabled={busy}
        data-testid="e2e-signup-email-next"
      >
        인증번호 받기
      </Button>
    </div>
  );
}
