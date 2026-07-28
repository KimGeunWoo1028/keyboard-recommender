"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendSignupEmailCode, verifySignupEmailCode } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { FieldValidationError, useKoreanFieldValidation } from "@/lib/use-korean-field-validation";
import { useState } from "react";

type Props = {
  initialEmail?: string;
  onVerified: (payload: { email: string; emailVerificationToken: string }) => void;
  busy?: boolean;
};

export function SignupStepEmail({ initialEmail = "", onVerified, busy = false }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const emailField = useKoreanFieldValidation("email");

  async function onSendCode() {
    const trimmed = email.trim();
    setMessage(null);
    setEmailVerified(false);
    setEmailVerificationToken(null);
    if (!trimmed) {
      setMessage("이메일을 먼저 입력해 주세요.");
      return;
    }
    setSending(true);
    try {
      const res = await sendSignupEmailCode(trimmed);
      setEmailCodeSent(true);
      setMessage(
        res.delivery === "smtp"
          ? "인증번호를 이메일로 보냈습니다."
          : "인증번호 요청이 접수되었습니다. 메일 도착까지 잠시 기다려 주세요.",
      );
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

  async function onVerifyCode() {
    const trimmed = email.trim();
    const code = emailCode.trim();
    setMessage(null);
    setEmailVerified(false);
    setEmailVerificationToken(null);
    if (!trimmed || !emailCodeSent) {
      setMessage("먼저 인증번호를 발송해 주세요.");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setMessage("인증번호 6자리를 입력해 주세요.");
      return;
    }
    setVerifying(true);
    try {
      const res = await verifySignupEmailCode({ email: trimmed, code });
      setEmailVerified(res.verified);
      setEmailVerificationToken(res.verification_token);
      setMessage("이메일 인증이 완료되었습니다.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setMessage("인증번호가 올바르지 않거나 만료되었습니다.");
      } else {
        setMessage(err instanceof Error ? err.message : "인증 확인에 실패했습니다.");
      }
    } finally {
      setVerifying(false);
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
            setEmailCode("");
            setEmailCodeSent(false);
            setEmailVerified(false);
            setEmailVerificationToken(null);
            setMessage(null);
          }}
          required
          disabled={busy || sending || verifying || emailVerified}
          {...emailField.inputProps}
        />
        <FieldValidationError id={emailField.errorId} message={emailField.error} />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => void onSendCode()}
        loading={sending}
        disabled={busy || verifying || emailVerified}
      >
        인증번호 발송
      </Button>

      <div className="space-y-2">
        <Label htmlFor="signup-email-code" className="ca-label">
          이메일 인증번호
        </Label>
        <div className="flex min-w-0 items-center gap-2">
          <Input
            id="signup-email-code"
            className="ca-input min-w-0 flex-1 text-center"
            inputMode="numeric"
            maxLength={6}
            placeholder="6자리 숫자"
            value={emailCode}
            onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            disabled={busy || !emailCodeSent || emailVerified || verifying}
          />
          <Button
            type="button"
            variant="outline"
            className="min-w-[5.5rem] shrink-0"
            onClick={() => void onVerifyCode()}
            loading={verifying}
            disabled={!emailCodeSent || emailVerified || busy || sending}
          >
            {emailVerified ? "인증 완료" : "인증 확인"}
          </Button>
        </div>
      </div>

      {message ? <p className="text-sm text-ca-on-surface-variant">{message}</p> : null}

      <Button
        type="button"
        className="w-full"
        disabled={!emailVerified || !emailVerificationToken || busy}
        onClick={() => {
          if (!emailVerificationToken) return;
          onVerified({ email: email.trim(), emailVerificationToken });
        }}
        data-testid="e2e-signup-email-next"
      >
        다음
      </Button>
    </div>
  );
}
