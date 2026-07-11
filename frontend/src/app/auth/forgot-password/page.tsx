"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await requestPasswordReset(email);
      setSubmitted(true);
      if (res.delivery === "smtp") {
        setMessage("입력한 이메일로 비밀번호 재설정 안내 메일을 보냈습니다.");
      } else {
        setMessage("요청이 접수되었습니다. 메일 설정 후 재요청하면 실제 메일을 받을 수 있습니다.");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setError("이메일 형식을 확인해 주세요.");
      } else {
        setError(err instanceof Error ? err.message : "요청을 처리하지 못했습니다. 다시 시도해 주세요.");
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
          <CardTitle className="font-headline text-ca-on-surface">비밀번호 찾기</CardTitle>
          <CardDescription className="text-ca-on-surface-variant">
            가입한 이메일을 입력하면 비밀번호 재설정 안내를 받을 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="space-y-1">
              <Label htmlFor="email" className="ca-label">
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                className="ca-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={busy}>
              {busy ? "요청 중..." : "재설정 안내 받기"}
            </Button>
          </form>
          {submitted && message ? <p className="text-xs text-ca-viz-emerald">{message}</p> : null}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
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
