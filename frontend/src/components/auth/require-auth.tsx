"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { useAuthHeader } from "@/components/layout/auth-controls";
import { Button, buttonClassName } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getPublicApiBase } from "@/lib/api/client";

type Props = {
  children: ReactNode;
  /** Shown while session is resolving. Prefer survey-shaped shell on /recommend for LCP. */
  loadingFallback?: ReactNode;
};

/**
 * Ensures the visitor has a valid API session before rendering children.
 *
 * Reuses ``AuthHeaderProvider`` session state (single ``GET /auth/me``) instead of
 * issuing a second request. Next.js middleware cannot see cross-origin API cookies.
 */
export function RequireAuth({ children, loadingFallback }: Props) {
  const router = useRouter();
  const { user, authChecked } = useAuthHeader();
  const [configError, setConfigError] = useState<string | null>(null);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!getPublicApiBase()) {
      setConfigError(
        "NEXT_PUBLIC_API_URL이 비어 있습니다. frontend/.env.local에 API 주소를 넣고 개발 서버(npm run dev)를 다시 시작해 주세요. (예: NEXT_PUBLIC_API_URL=http://localhost:8010)",
      );
      return;
    }
    setConfigError(null);
  }, []);

  useEffect(() => {
    if (!authChecked || configError || user) {
      redirectedRef.current = false;
      return;
    }
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    const next = `${window.location.pathname}${window.location.search}`;
    router.replace(`/auth?next=${encodeURIComponent(next)}`);
  }, [authChecked, configError, user, router]);

  if (configError) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 rounded-xl border border-border/80 bg-card/40 p-6 text-center">
        <p className="text-sm text-foreground">{configError}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link href="/" className={buttonClassName({ variant: "outline", size: "default" })}>
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  if (authChecked && user) {
    return <>{children}</>;
  }

  if (loadingFallback) {
    return <>{loadingFallback}</>;
  }

  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center"
      aria-busy="true"
      aria-live="polite"
    >
      <Spinner className="text-2xl text-ca-primary" label="로그인 정보 확인 중" />
      <p className="text-sm text-muted-foreground">로그인 정보를 확인하는 중입니다…</p>
      {authChecked && !user ? (
        <p className="max-w-sm break-keep text-sm text-muted-foreground">
          이 화면은 로그인 후 이용할 수 있습니다. 카탈로그는 로그인 없이 둘러볼 수 있어요.
        </p>
      ) : null}
      {authChecked && !user ? (
        <Button
          type="button"
          variant="primary"
          onClick={() => {
            const next = `${window.location.pathname}${window.location.search}`;
            router.replace(`/auth?next=${encodeURIComponent(next)}`);
          }}
        >
          로그인하러 가기
        </Button>
      ) : null}
    </div>
  );
}
