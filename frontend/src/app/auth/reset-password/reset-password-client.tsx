"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmPasswordReset } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

function isPasswordPolicyValid(value: string): boolean {
  if (!/^[\x21-\x7E]{8,20}$/.test(value)) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  if (!/\d/.test(value)) return false;
  if (!/[^A-Za-z0-9]/.test(value)) return false;
  return true;
}

export function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => (searchParams.get("token") || "").trim(), [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const passwordMatches = confirmPassword.length > 0 && newPassword === confirmPassword;
  const policyValid = isPasswordPolicyValid(newPassword);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!token) {
        setError("재설정 링크가 올바르지 않습니다.");
        return;
      }
      if (!policyValid) {
        setError("비밀번호는 8~20자, 영문/숫자/특수문자를 모두 포함해야 합니다.");
        return;
      }
      if (!passwordMatches) {
        setError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        return;
      }
      await confirmPasswordReset({ token, new_password: newPassword });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError("링크가 만료되었거나 이미 사용되었습니다. 비밀번호 찾기를 다시 진행해 주세요.");
      } else if (err instanceof ApiError && err.status === 422) {
        setError("비밀번호 형식을 확인해 주세요.");
      } else {
        setError(err instanceof Error ? err.message : "요청을 처리하지 못했습니다.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-ca-margin-mobile py-10 sm:px-ca-margin">
      <Card className="ca-glass-panel border-ca-outline-variant/40">
        <CardHeader className="border-b-0">
          <p className="font-label text-ca-label-sm font-medium text-ca-secondary">AUTH</p>
          <CardTitle className="font-headline text-ca-on-surface">비밀번호 재설정</CardTitle>
          <CardDescription className="text-ca-on-surface-variant">새 비밀번호를 입력해 주세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {done ? (
            <div className="space-y-3">
              <p className="text-sm text-ca-viz-emerald">비밀번호가 성공적으로 변경되었습니다.</p>
              <Button
                type="button"
                className="w-full rounded-full"
                onClick={() => {
                  router.push("/auth?force=1");
                  router.refresh();
                }}
              >
                로그인하러 가기
              </Button>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={onSubmit}>
              <div className="space-y-1">
                <Label htmlFor="newPassword" className="ca-label">
                  새 비밀번호
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    maxLength={20}
                    disabled={busy}
                    className="ca-input pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-ca-on-surface-variant hover:text-ca-on-surface"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                    disabled={busy}
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
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="ca-label">
                  새 비밀번호 확인
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    maxLength={20}
                    disabled={busy}
                    className="ca-input pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-ca-on-surface-variant hover:text-ca-on-surface"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "비밀번호 확인 숨기기" : "비밀번호 확인 보기"}
                    disabled={busy}
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
              </div>
              <p className="text-xs text-ca-on-surface">
                <span className={policyValid ? "text-ca-viz-emerald" : "text-destructive"}>{policyValid ? "✓" : "✗"}</span>{" "}
                8~20자, 영문/숫자/특수기호 포함
              </p>
              <p className="text-xs text-ca-on-surface">
                <span className={passwordMatches ? "text-ca-viz-emerald" : "text-destructive"}>
                  {passwordMatches ? "✓" : "✗"}
                </span>{" "}
                {passwordMatches ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다."}
              </p>
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full rounded-full" loading={busy}>
                비밀번호 변경
              </Button>
            </form>
          )}
          <Link
            href="/auth?force=1"
            className="font-label text-ca-label-sm font-medium text-ca-primary underline-offset-2 hover:underline"
          >
            로그인 화면으로 돌아가기
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
