"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AuthNickname, AuthSessionAction } from "@/components/layout/auth-controls";
import { HeaderCatalogSearch } from "@/components/layout/header-catalog-search";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { isInternalDebugUiEnabled } from "@/lib/internal-debug-flags";
import { hasUsableRecentRecommendationResult } from "@/lib/survey-storage";
import { cn } from "@/lib/utils";

const primaryNav: { href: string; label: string }[] = [
  { href: "/recommend", label: "설문" },
  { href: "/catalog", label: "카탈로그" },
  { href: "/results", label: "결과" },
  { href: "/mypage", label: "마이페이지" },
];

if (isInternalDebugUiEnabled()) {
  primaryNav.push({ href: "/debug", label: "디버그" });
}

function navActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  // Hide until client mount + storage check to avoid SSR/hydration flicker (L04).
  const [showResultsNav, setShowResultsNav] = useState(false);

  useEffect(() => {
    setShowResultsNav(hasUsableRecentRecommendationResult());
  }, [pathname]);

  const navItems = useMemo(
    () => primaryNav.filter((item) => item.href !== "/results" || showResultsNav),
    [showResultsNav],
  );
  // L08: catalog page already has in-body search — hide header duplicate there.
  const isCatalogRoute = pathname === "/catalog" || pathname.startsWith("/catalog/");
  /**
   * On primary surfaces first paint, skip speculative RSC/JS prefetch of other
   * tabs so Lighthouse unused-chunk noise stays down and LCP bandwidth is free.
   */
  const deferNavPrefetch =
    pathname === "/" ||
    pathname === "/catalog" ||
    pathname.startsWith("/catalog/") ||
    pathname === "/recommend" ||
    pathname.startsWith("/recommend/") ||
    pathname === "/results" ||
    pathname.startsWith("/results/") ||
    pathname === "/mypage" ||
    pathname.startsWith("/mypage/") ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/");

  return (
    <header className="sticky top-0 z-50 border-b border-ca-outline-variant/40 bg-ca-surface dark:bg-ca-surface-dim">
      <div className="mx-auto flex w-full max-w-ca items-center justify-between gap-3 px-ca-margin-mobile py-3 md:gap-4 md:px-ca-margin md:py-4">
        <div className="flex min-w-0 items-center gap-3 md:gap-8">
          <Link
            href="/"
            prefetch={deferNavPrefetch ? false : undefined}
            aria-label="Keyboard Recommender 홈"
            className="inline-flex min-w-0 shrink items-center gap-2 rounded-btn font-headline text-base font-bold leading-none tracking-tight text-ca-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] md:gap-3 md:text-[1.45rem]"
          >
            <Image
              src="/brand/logo-mark.png"
              alt=""
              width={48}
              height={48}
              className="h-9 w-9 shrink-0 rounded-[0.7rem] md:h-12 md:w-12 md:rounded-[0.9rem]"
              aria-hidden
              /* Avoid competing with catalog/home LCP candidates when nav prefetch is deferred */
              priority={!deferNavPrefetch}
            />
            <span className="truncate">Keyboard Recommender</span>
          </Link>

          <nav className="hidden shrink-0 items-center gap-5 lg:flex xl:gap-6" aria-label="주요">
            {navItems.map((item) => {
              const active = navActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={deferNavPrefetch ? false : undefined}
                  className={cn(
                    "relative inline-flex shrink-0 items-center whitespace-nowrap font-body text-sm font-medium leading-none tracking-normal transition-colors",
                    /* underline sits outside the line box so it doesn't pull the label up */
                    "after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-1.5 after:h-0.5 after:rounded-full after:content-['']",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active
                      ? "font-semibold text-ca-primary after:bg-ca-primary"
                      : "text-ca-on-surface-variant after:bg-transparent hover:text-ca-on-surface",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-3">
          {!isCatalogRoute ? <HeaderCatalogSearch className="hidden shrink-0 lg:block" /> : null}
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
          <AuthNickname />
          <AuthSessionAction />
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-btn text-ca-on-surface-variant transition-colors hover:bg-ca-surface-variant/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="site-mobile-nav"
            aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="site-mobile-nav"
          className="border-t border-ca-outline-variant/40 bg-ca-surface-container-low px-ca-margin-mobile py-3 lg:hidden"
        >
          <div className="mb-3 flex items-center justify-between rounded-btn border border-ca-outline-variant/30 bg-ca-surface-container/50 px-3 py-2">
            <span className="font-body text-sm font-medium text-ca-on-surface-variant">테마</span>
            <ThemeToggle />
          </div>
          {!isCatalogRoute ? (
            <div className="mb-3 space-y-1.5">
              <p className="font-body text-xs font-medium text-ca-on-surface-variant">카탈로그 검색</p>
              <HeaderCatalogSearch className="block lg:hidden" />
            </div>
          ) : null}
          <nav className="flex flex-col gap-1" aria-label="모바일">
            <Link
              href="/"
              prefetch={deferNavPrefetch ? false : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "rounded-btn px-3 py-2 font-body text-sm font-medium",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]",
                navActive(pathname, "/")
                  ? "bg-ca-primary/15 text-ca-primary"
                  : "text-ca-on-surface-variant hover:bg-ca-surface-variant/40 hover:text-ca-on-surface",
              )}
            >
              홈
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={deferNavPrefetch ? false : undefined}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-btn px-3 py-2 font-body text-sm font-medium",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]",
                  navActive(pathname, item.href)
                    ? "bg-ca-primary/15 text-ca-primary"
                    : "text-ca-on-surface-variant hover:bg-ca-surface-variant/40 hover:text-ca-on-surface",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
