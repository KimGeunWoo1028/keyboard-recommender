"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkDisplayNameAvailability } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { isRetryableDisplayNameCheckError, validateDisplayName } from "@/lib/auth-form-helpers";
import { KO_VALIDATION } from "@/lib/form-validation-ko";
import { FieldValidationError, useKoreanFieldValidation } from "@/lib/use-korean-field-validation";

type Props = {
  onSubmitSignup: (displayName: string) => Promise<void>;
  busy?: boolean;
  formError?: string | null;
};

export function SignupStepNickname({ onSubmitSignup, busy = false, formError = null }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const displayNameField = useKoreanFieldValidation("displayName");
  const validation = validateDisplayName(displayName);

  async function onCheck() {
    const value = displayName.trim();
    setCheckMessage(null);
    setVerified(false);
    setLocalError(null);
    if (!validation.valid) {
      setCheckMessage(validation.message);
      return;
    }
    setChecking(true);
    try {
      const res = await checkDisplayNameAvailability(value);
      if (res.available) {
        setCheckMessage("사용 가능한 닉네임입니다.");
        setVerified(true);
      } else {
        setCheckMessage("이미 사용중입니다.");
      }
    } catch (err) {
      if (isRetryableDisplayNameCheckError(err) || (err instanceof ApiError && err.status === 404)) {
        setCheckMessage("지금은 중복 확인이 어렵습니다. 잠시 후 다시 시도해 주세요.");
      } else if (err instanceof ApiError && err.status === 422) {
        setCheckMessage("닉네임 형식을 확인해 주세요.");
      } else {
        setCheckMessage(err instanceof Error ? err.message : "중복 확인에 실패했습니다.");
      }
    } finally {
      setChecking(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!validation.valid) {
      setLocalError(validation.message);
      return;
    }
    if (!verified) {
      setLocalError("닉네임 중복 확인을 먼저 완료해 주세요.");
      return;
    }
    if (!agreedToTerms) {
      setLocalError(KO_VALIDATION.termsRequired);
      return;
    }
    await onSubmitSignup(displayName.trim());
  }

  const error = formError || localError;

  return (
    <form className="space-y-4" onSubmit={(e) => void onSubmit(e)} data-testid="e2e-signup-step-nickname">
      <div className="space-y-2">
        <Label htmlFor="signup-display-name" className="ca-label">
          닉네임
        </Label>
        <div className="flex min-w-0 gap-2">
          <Input
            id="signup-display-name"
            className="ca-input min-w-0 flex-1"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setCheckMessage(null);
              setVerified(false);
            }}
            required
            disabled={busy || checking}
            {...displayNameField.inputProps}
          />
          <Button
            type="button"
            variant="outline"
            className="min-w-[5.5rem] shrink-0"
            onClick={() => void onCheck()}
            loading={checking}
            disabled={busy}
          >
            중복 확인
          </Button>
        </div>
        <FieldValidationError id={displayNameField.errorId} message={displayNameField.error} />
        <p className="break-keep text-xs text-ca-on-surface-variant">
          2자 이상, 한글 또는 영문으로 시작해야 합니다.
        </p>
        {checkMessage ? (
          <p className="text-sm text-ca-on-surface-variant">
            {checkMessage}
            {verified ? " (중복 확인 완료)" : ""}
          </p>
        ) : null}
      </div>

      <label className="flex items-start gap-2.5 break-keep text-xs leading-relaxed text-ca-on-surface-variant">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          checked={agreedToTerms}
          onChange={(e) => {
            setAgreedToTerms(e.target.checked);
            setLocalError(null);
          }}
          data-testid="e2e-signup-terms"
        />
        <span>
          <Link href="/terms" prefetch={false} className="underline underline-offset-2 hover:text-ca-on-surface">
            이용약관
          </Link>
          과{" "}
          <Link href="/privacy" prefetch={false} className="underline underline-offset-2 hover:text-ca-on-surface">
            개인정보처리방침
          </Link>
          에 동의합니다. (필수)
        </span>
      </label>

      {error ? (
        <p className="break-keep text-sm text-destructive" role="alert" data-testid="e2e-auth-error">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        loading={busy}
        disabled={!verified || !agreedToTerms || busy}
        data-testid="e2e-auth-submit"
      >
        계정 만들기
      </Button>
    </form>
  );
}
