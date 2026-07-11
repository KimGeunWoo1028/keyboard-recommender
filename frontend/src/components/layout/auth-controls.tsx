"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { fetchCurrentUser, logout, subscribeAuthChanged, type AuthUser } from "@/lib/api/auth";
import { getPublicApiBase } from "@/lib/api/client";
import { resolveAvatarSrc } from "@/lib/avatar";
import { cn } from "@/lib/utils";

const AUTH_CHECK_TIMEOUT_MS = 8_000;

type AuthHeaderContextValue = {
  user: AuthUser | null;
  authChecked: boolean;
  setUser: (user: AuthUser | null) => void;
};

const AuthHeaderContext = createContext<AuthHeaderContextValue>({
  user: null,
  authChecked: false,
  setUser: () => undefined,
});

async function fetchCurrentUserWithTimeout(): Promise<AuthUser | null> {
  const base = getPublicApiBase();
  if (!base) return null;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), AUTH_CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/api/v1/auth/me`, {
      headers: { Accept: "application/json" },
      credentials: "include",
      signal: controller.signal,
    });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    const json = (await res.json()) as { user: AuthUser };
    return json.user;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function AuthHeaderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    const sync = () =>
      void fetchCurrentUserWithTimeout()
        .then((u) => {
          if (mounted) setUser(u);
        })
        .finally(() => {
          if (mounted) setAuthChecked(true);
        });
    sync();
    const unsub = subscribeAuthChanged(() => {
      setAuthChecked(false);
      void fetchCurrentUser()
        .then((u) => {
          if (mounted) setUser(u);
        })
        .catch(() => {
          if (mounted) setUser(null);
        })
        .finally(() => {
          if (mounted) setAuthChecked(true);
        });
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, [pathname]);

  return <AuthHeaderContext.Provider value={{ user, authChecked, setUser }}>{children}</AuthHeaderContext.Provider>;
}

export function useAuthHeader() {
  return useContext(AuthHeaderContext);
}

export function AuthNickname() {
  const { user } = useAuthHeader();
  if (!user) return null;

  const label = user.display_name || user.email;
  const avatarSrc = resolveAvatarSrc(user.avatar_url);

  return (
    <Link
      href="/mypage"
      className="hidden max-w-[14rem] shrink-0 items-center gap-2.5 font-body text-base font-medium text-ca-on-surface-variant transition-colors hover:text-ca-on-surface lg:inline-flex"
      title={label}
    >
      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-ca-outline-variant/50 bg-ca-surface-container/60">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote API avatar + local default */}
        <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}

export function AuthSessionAction() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, authChecked, setUser } = useAuthHeader();

  if (!user) {
    const nextPath = pathname && pathname !== "/auth" ? pathname : "/results";
    return (
      <Link
        href={`/auth?force=1&next=${encodeURIComponent(nextPath)}`}
        className={cn(
          "shrink-0 whitespace-nowrap rounded-full bg-ca-primary-container px-4 py-2 font-headline text-sm font-bold text-ca-on-primary-container",
          "transition-transform hover:scale-[0.97] active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ca-primary",
          "sm:px-5",
          !authChecked && "opacity-80",
        )}
        aria-busy={!authChecked}
      >
        로그인
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border border-ca-outline-variant px-3 py-1.5 font-headline text-xs font-semibold",
        "text-ca-on-surface-variant transition-colors hover:border-ca-primary/50 hover:text-ca-on-surface",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ca-primary",
        "sm:px-3.5",
      )}
      onClick={() => {
        void logout().finally(() => {
          setUser(null);
          router.push("/auth?force=1");
          router.refresh();
        });
      }}
    >
      로그아웃
    </button>
  );
}

/** @deprecated Use AuthHeaderProvider + AuthNickname + AuthSessionAction */
export function AuthControls() {
  return (
    <>
      <AuthNickname />
      <AuthSessionAction />
    </>
  );
}
