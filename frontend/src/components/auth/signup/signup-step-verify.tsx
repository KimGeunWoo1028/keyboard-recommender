"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { sendSignupEmailCode, verifySignupEmailCode } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { formatCooldownMmSs, resendCooldownRemaining } from "@/lib/signup-draft";
import { cn } from "@/lib/utils";

const DIGIT_COUNT = 6;

type Props = {
  email: string;
  codeSentAt?: number;
  onVerified: (payload: { email: string; emailVerificationToken: string }) => void;
  onChangeEmail: () => void;
  onCodeResent: (codeSentAt: number) => void;
  busy?: boolean;
};

function digitsFromString(raw: string): string[] {
  return raw.replace(/\D/g, "").slice(0, DIGIT_COUNT).split("");
}

export function SignupStepVerify({
  email,
  codeSentAt,
  onVerified,
  onChangeEmail,
  onCodeResent,
  busy = false,
}: Props) {
  const [digits, setDigits] = useState<string[]>(() => Array(DIGIT_COUNT).fill(""));
  const [message, setMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(() => resendCooldownRemaining(codeSentAt));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setCooldown(resendCooldownRemaining(codeSentAt));
    const id = window.setInterval(() => {
      setCooldown(resendCooldownRemaining(codeSentAt));
    }, 500);
    return () => window.clearInterval(id);
  }, [codeSentAt]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const code = digits.join("");
  const canVerify = /^\d{6}$/.test(code);

  function setDigitAt(index: number, value: string) {
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setMessage(null);
  }

  function onDigitChange(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, "");
    if (cleaned.length > 1) {
      // Paste into a single box or rapid input
      const pasted = digitsFromString(cleaned);
      const next = [...digits];
      for (let i = 0; i < pasted.length && index + i < DIGIT_COUNT; i += 1) {
        next[index + i] = pasted[i]!;
      }
      setDigits(next);
      setMessage(null);
      const focusAt = Math.min(index + pasted.length, DIGIT_COUNT - 1);
      inputsRef.current[focusAt]?.focus();
      return;
    }
    setDigitAt(index, cleaned.slice(-1));
    if (cleaned && index < DIGIT_COUNT - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      setDigitAt(index - 1, "");
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < DIGIT_COUNT - 1) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = digitsFromString(e.clipboardData.getData("text"));
    if (!pasted.length) return;
    const next = Array(DIGIT_COUNT).fill("");
    for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i]!;
    setDigits(next);
    setMessage(null);
    inputsRef.current[Math.min(pasted.length, DIGIT_COUNT) - 1]?.focus();
  }

  async function onVerify(e?: FormEvent) {
    e?.preventDefault();
    setMessage(null);
    if (!canVerify) {
      setMessage("인증번호 6자리를 입력해 주세요.");
      return;
    }
    setVerifying(true);
    try {
      const res = await verifySignupEmailCode({ email, code });
      setMessage("이메일 인증이 완료되었습니다.");
      onVerified({ email, emailVerificationToken: res.verification_token });
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

  async function onResend() {
    if (cooldown > 0 || resending || busy) return;
    setResending(true);
    setMessage(null);
    try {
      const res = await sendSignupEmailCode(email);
      const sentAt = Date.now();
      onCodeResent(sentAt);
      setDigits(Array(DIGIT_COUNT).fill(""));
      setMessage(
        res.delivery === "smtp"
          ? "인증번호를 다시 보냈습니다."
          : "인증번호 재요청이 접수되었습니다.",
      );
      inputsRef.current[0]?.focus();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "인증번호 재발송에 실패했습니다.");
    } finally {
      setResending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={(e) => void onVerify(e)} data-testid="e2e-signup-step-verify">
      <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant">
        <span className="font-medium text-ca-on-surface">{email}</span>으로 보낸 6자리 인증번호를
        입력해 주세요.
      </p>

      <div className="flex justify-between gap-1.5 sm:gap-2" role="group" aria-label="이메일 인증번호 6자리">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            disabled={busy || verifying}
            aria-label={`인증번호 ${index + 1}번째 자리`}
            onChange={(e) => onDigitChange(index, e.target.value)}
            onKeyDown={(e) => onKeyDown(index, e)}
            onPaste={onPaste}
            onFocus={(e) => e.currentTarget.select()}
            className={cn(
              "h-12 min-w-0 flex-1 rounded-md border-2 bg-white text-center font-headline text-lg font-bold text-ca-on-surface outline-none transition-colors dark:bg-ca-surface-container sm:max-w-11",
              "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
              digit
                ? "border-ca-on-surface dark:border-ca-on-surface"
                : "border-[rgb(220_220_238)] dark:border-border",
            )}
            data-testid={index === 0 ? "e2e-signup-otp-0" : undefined}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ca-on-surface-variant">
        <span>못 받으셨나요?</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 rounded-full px-3"
          onClick={() => void onResend()}
          loading={resending}
          disabled={cooldown > 0 || busy || verifying}
        >
          재발송
        </Button>
        {cooldown > 0 ? (
          <span className="ml-auto tabular-nums text-ca-on-surface" aria-live="polite">
            {formatCooldownMmSs(cooldown)}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        className="text-sm font-medium text-primary underline underline-offset-2"
        onClick={onChangeEmail}
        disabled={busy || verifying}
      >
        이메일 주소 변경
      </button>

      {message ? <p className="text-sm text-ca-on-surface-variant">{message}</p> : null}

      <Button
        type="submit"
        className="w-full"
        loading={verifying}
        disabled={!canVerify || busy}
        data-testid="e2e-signup-verify-next"
      >
        인증 확인
      </Button>
    </form>
  );
}
