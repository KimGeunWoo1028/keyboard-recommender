"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { fetchCurrentUser, logout, subscribeAuthChanged, type AuthUser } from "@/lib/api/auth";
import { resolveAvatarSrc } from "@/lib/avatar";
import { Spinner } from "@/components/ui/spinner";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AUTH_CHECK_TIMEOUT_MS = 12_000;
const AUTH_ME_TIMEOUT = Symbol("auth-me-timeout");

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

/** Single in-flight /auth/me shared by header + RequireAuth consumers. */
let sharedAuthMePromise: Promise<AuthUser | null> | null = null;

function fetchCurrentUserShared(): Promise<AuthUser | null> {
  if (!sharedAuthMePromise) {
    sharedAuthMePromise = (async () => {
      try {
        const timed = new Promise<typeof AUTH_ME_TIMEOUT>((resolve) => {
          window.setTimeout(() => resolve(AUTH_ME_TIMEOUT), AUTH_CHECK_TIMEOUT_MS);
        });
        const first = await Promise.race([fetchCurrentUser(), timed]);
        // Do not treat a slow /me as logged-out — that bounces RequireAuth back to /auth
        // on mobile/cold-start. Retry once without the race.
        if (first === AUTH_ME_TIMEOUT) {
          return await fetchCurrentUser();
        }
        return first;
      } catch {
        return null;
      } finally {
        sharedAuthMePromise = null;
      }
    })();
  }
  return sharedAuthMePromise;
}

export function AuthHeaderProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    /** Bumped on login/logout so a stale in-flight /me cannot overwrite the new session. */
    let syncGeneration = 0;

    const syncFromServer = () => {
      const generation = ++syncGeneration;
      sharedAuthMePromise = null;
      void fetchCurrentUserShared()
        .then((u) => {
          if (mounted && generation === syncGeneration) setUser(u);
        })
        .finally(() => {
          if (mounted && generation === syncGeneration) setAuthChecked(true);
        });
    };

    syncFromServer();
    const unsub = subscribeAuthChanged((detail) => {
      // Login/logout already know the session — apply immediately and invalidate
      // any older /me so RequireAuth cannot bounce back to /auth.
      if (detail && "user" in detail) {
        syncGeneration += 1;
        sharedAuthMePromise = null;
        setUser(detail.user ?? null);
        setAuthChecked(true);
        return;
      }
      setAuthChecked(false);
      syncFromServer();
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  return <AuthHeaderContext.Provider value={{ user, authChecked, setUser }}>{children}</AuthHeaderContext.Provider>;
}

export function useAuthHeader() {
  return useContext(AuthHeaderContext);
}

export function AuthNickname() {
  const { user } = useAuthHeader();
  const [desktopNav, setDesktopNav] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktopNav(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Avoid mounting the avatar <img> on mobile (CSS `hidden` still downloads the file).
  if (!user || !desktopNav) return null;

  const label = user.display_name || user.email;
  const avatarSrc = resolveAvatarSrc(user.avatar_url);

  return (
    <Link
      href="/mypage"
      prefetch={false}
      className="inline-flex max-w-[14rem] shrink-0 items-center gap-2.5 font-body text-base font-medium text-ca-on-surface-variant transition-colors hover:text-ca-on-surface"
      title={label}
    >
      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-ca-outline-variant/50 bg-ca-surface-container/60">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote API avatar + local default */}
        <img src={avatarSrc} alt="" width={32} height={32} className="h-full w-full object-cover" loading="lazy" decoding="async" />
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}

export function AuthSessionAction() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, authChecked, setUser } = useAuthHeader();
  const [loggingOut, setLoggingOut] = useState(false);

  // Always wait for authChecked so SSR + first client paint match (avoids React #418).
  if (!authChecked) {
    return (
      <span
        className="inline-flex h-9 min-w-[4.75rem] items-center justify-center rounded-btn bg-ca-surface-container/70 px-3"
        aria-busy="true"
        aria-live="polite"
      >
        <Spinner className="text-sm text-ca-on-surface-variant" label="로그인 상태 확인 중" />
      </span>
    );
  }

  if (!user) {
    const nextPath = pathname && !pathname.startsWith("/auth") ? pathname : "/results";
    return (
      <Link
        href={`/auth?force=1&next=${encodeURIComponent(nextPath)}`}
        prefetch={false}
        className={cn(
          buttonClassName({ variant: "outline", size: "sm" }),
          "h-9 min-w-[4.75rem] shrink-0 border-ca-outline-variant/50 px-3 font-headline text-xs font-bold sm:px-5 sm:text-sm",
        )}
      >
        로그인
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-btn border border-ca-outline-variant px-2.5 py-1.5 font-headline text-[11px] font-semibold sm:px-3.5 sm:text-xs",
        "min-w-[4.75rem] text-ca-on-surface-variant transition-colors hover:border-ca-primary/50 hover:text-ca-on-surface",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ca-primary",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
      disabled={loggingOut}
      aria-busy={loggingOut || undefined}
      onClick={() => {
        setLoggingOut(true);
        void logout()
          .finally(() => {
            setUser(null);
            setLoggingOut(false);
            router.push("/");
            router.refresh();
          });
      }}
    >
      <span className={cn(loggingOut && "invisible")}>로그아웃</span>
      {loggingOut ? (
        <span className="pointer-events-none absolute inset-0 inline-flex items-center justify-center" aria-hidden="true">
          <Spinner className="text-[0.85rem]" />
        </span>
      ) : null}
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
