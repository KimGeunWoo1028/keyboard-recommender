"use client";

import { useRef, useState, type FormEvent } from "react";

import { PasswordVisibilityToggle } from "@/components/auth/password-visibility-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isPasswordPolicyValid } from "@/lib/auth-form-helpers";
import { syncPasswordMatchValidity } from "@/lib/form-validation-ko";
import { FieldValidationError, useKoreanFieldValidation } from "@/lib/use-korean-field-validation";

type Props = {
  onContinue: (password: string) => void;
  busy?: boolean;
};

export function SignupStepPassword({ onContinue, busy = false }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordField = useKoreanFieldValidation("password");
  const confirmPasswordField = useKoreanFieldValidation("confirmPassword");
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement | null>(null);

  const passwordMatches = confirmPassword.length > 0 && password === confirmPassword;
  const hasRequiredCharTypes = /[A-Za-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
  const hasValidPasswordLength = password.length >= 8 && password.length <= 20;
  const canContinue = passwordMatches && isPasswordPolicyValid(password);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    syncPasswordMatchValidity(passwordInputRef.current, confirmPasswordInputRef.current);
    if (confirmPasswordInputRef.current && !confirmPasswordInputRef.current.checkValidity()) {
      confirmPasswordInputRef.current.reportValidity();
      return;
    }
    if (!passwordMatches) {
      setError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (!isPasswordPolicyValid(password)) {
      setError("비밀번호는 8~20자, 영문/숫자/특수문자를 모두 포함해야 합니다.");
      return;
    }
    onContinue(password);
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} data-testid="e2e-signup-step-password">
      <p className="break-keep text-sm text-ca-on-surface-variant">
        비밀번호는 8~20자, 영문·숫자·특수문자를 모두 포함해야 합니다.
      </p>

      <div className="space-y-2">
        <Label htmlFor="signup-password" className="ca-label">
          비밀번호
        </Label>
        <div className="relative">
          <Input
            ref={passwordInputRef}
            id="signup-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              syncPasswordMatchValidity(e.currentTarget, confirmPasswordInputRef.current);
            }}
            required
            minLength={8}
            maxLength={20}
            disabled={busy}
            className="ca-input pr-10"
            {...passwordField.inputProps}
          />
          <PasswordVisibilityToggle
            visible={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
            disabled={busy}
          />
        </div>
        <FieldValidationError id={passwordField.errorId} message={passwordField.error} />
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm-password" className="ca-label">
          비밀번호 확인
        </Label>
        <div className="relative">
          <Input
            ref={confirmPasswordInputRef}
            id="signup-confirm-password"
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
            disabled={busy}
            className="ca-input pr-10"
            {...confirmPasswordField.inputProps}
          />
          <PasswordVisibilityToggle
            visible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((v) => !v)}
            disabled={busy}
            hideLabel="비밀번호 확인 숨기기"
            showLabel="비밀번호 확인 보기"
          />
        </div>
        <FieldValidationError id={confirmPasswordField.errorId} message={confirmPasswordField.error} />
        <p className="text-sm text-ca-on-surface-variant">
          <span className={passwordMatches ? "text-ca-viz-emerald" : "text-destructive"}>
            {passwordMatches ? "✓" : "✗"}
          </span>{" "}
          {passwordMatches ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다."}
        </p>
      </div>

      {error ? (
        <p className="break-keep text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={!canContinue || busy} data-testid="e2e-signup-password-next">
        다음
      </Button>
    </form>
  );
}
