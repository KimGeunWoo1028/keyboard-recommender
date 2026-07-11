"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useState } from "react";

import { Button, buttonClassName } from "@/components/ui/button";
import { ApiError, getPublicApiBase } from "@/lib/api/client";
import { fetchCurrentUser, subscribeAuthChanged } from "@/lib/api/auth";

type Props = { children: ReactNode };

/**
 * Ensures the visitor has a valid API session (cookie on the backend origin) before rendering children.
 *
 * Next.js middleware only sees cookies on the **page** host; when the API runs on another origin/port the
 * session cookie is invisible to middleware. This gate calls ``GET /auth/me`` with credentials instead.
 */
export function RequireAuth({ children }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verify = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);

    if (!getPublicApiBase()) {
      setStatus("error");
      setErrorMessage(
        "NEXT_PUBLIC_API_URL이 비어 있습니다. frontend/.env.local에 API 주소를 넣고 개발 서버(npm run dev)를 다시 시작해 주세요. (예: NEXT_PUBLIC_API_URL=http://localhost:8010)",
      );
      return;
    }

    try {
      const user = await fetchCurrentUser();
      if (!user) {
        const next = `${window.location.pathname}${window.location.search}`;
        router.replace(`/auth?next=${encodeURIComponent(next)}`);
        return;
      }
      setStatus("ok");
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 0
          ? e.message
          : e instanceof Error
            ? e.message
            : "인증을 확인하지 못했습니다.";
      setErrorMessage(msg);
      setStatus("error");
    }
  }, [router]);

  useEffect(() => {
    void verify();
    return subscribeAuthChanged(() => {
      void verify();
    });
  }, [verify]);

  if (status === "ok") {
    return <>{children}</>;
  }

  if (status === "error" && errorMessage) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 rounded-xl border border-border/80 bg-card/40 p-6 text-center">
        <p className="text-sm text-foreground">{errorMessage}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="primary" onClick={() => void verify()}>
            다시 시도
          </Button>
          <Link href="/" className={buttonClassName({ variant: "outline", size: "default" })}>
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
      <p className="text-sm text-muted-foreground">로그인 정보를 확인하는 중입니다…</p>
    </div>
  );
}
