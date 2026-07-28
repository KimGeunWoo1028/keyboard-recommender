"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthNickname, AuthSessionAction } from "@/components/layout/auth-controls";
import { HeaderCatalogSearch } from "@/components/layout/header-catalog-search";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { buttonClassName } from "@/components/ui/button";
import { useDialogA11y } from "@/components/ui/use-dialog-a11y";
import { isInternalDebugUiEnabled } from "@/lib/internal-debug-flags";
import { hasUsableRecentRecommendationResult } from "@/lib/survey-storage";
import { installSurveyNavPopListener } from "@/lib/survey-wizard-draft";
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
  const [scrolled, setScrolled] = useState(false);
  // Hide until client mount + storage check to avoid SSR/hydration flicker (L04).
  const [showResultsNav, setShowResultsNav] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const { panelRef: mobileNavRef, titleId: mobileNavTitleId } = useDialogA11y(mobileOpen, closeMobile);

  useEffect(() => {
    installSurveyNavPopListener();
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/80 bg-white/95 shadow-sm backdrop-blur-xl dark:bg-ca-surface/95"
          : "border-b border-transparent bg-white/80 backdrop-blur-sm dark:bg-ca-surface/80",
      )}
    >
      <div className="mx-auto flex h-[4.5rem] w-full max-w-ca items-center justify-between gap-3 px-ca-margin-mobile md:gap-4 md:px-ca-margin">
        <div className="flex min-w-0 items-center gap-3 md:gap-8">
          <Link
            href="/"
            prefetch={deferNavPrefetch ? false : undefined}
            aria-label="Keyboard Recommender 홈"
            className="inline-flex min-w-0 shrink items-center gap-2.5 rounded-lg font-headline text-[15px] font-bold leading-none tracking-tight text-ca-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]"
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              K
            </span>
            <span className="truncate">Keyboard Recommender</span>
          </Link>

          <nav className="hidden shrink-0 items-center gap-1 lg:flex" aria-label="주요">
            {navItems.map((item) => {
              const active = navActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={deferNavPrefetch ? false : undefined}
                  className={cn(
                    "rounded-md px-4 py-2.5 font-body text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
          <Link
            href="/recommend"
            prefetch={deferNavPrefetch ? false : undefined}
            className={cn(
              buttonClassName({ size: "sm" }),
              "hidden font-semibold lg:inline-flex",
            )}
          >
            설문 시작
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ca-on-surface-variant transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))] lg:hidden"
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
          ref={mobileNavRef}
          id="site-mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-labelledby={mobileNavTitleId}
          tabIndex={-1}
          className="border-t border-ca-outline-variant/40 bg-ca-surface-container-low px-ca-margin-mobile py-3 outline-none lg:hidden"
        >
          <p id={mobileNavTitleId} className="sr-only">
            모바일 메뉴
          </p>
          <nav className="flex flex-col gap-1" aria-label="모바일">
            <Link
              href="/"
              prefetch={deferNavPrefetch ? false : undefined}
              onClick={closeMobile}
              className={cn(
                "rounded-btn px-3 py-2.5 font-body text-sm font-medium",
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
                onClick={closeMobile}
                className={cn(
                  "rounded-btn px-3 py-2.5 font-body text-sm font-medium",
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
          <details className="group mt-3 rounded-btn border border-ca-outline-variant/30 bg-ca-surface-container/40">
            <summary className="cursor-pointer list-none px-3 py-2.5 font-body text-sm font-medium text-ca-on-surface-variant [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-2">
                <span>더보기</span>
                <span className="text-xs font-normal group-open:hidden">테마{!isCatalogRoute ? " · 검색" : ""}</span>
                <span className="hidden text-xs font-normal group-open:inline">접기</span>
              </span>
            </summary>
            <div className="space-y-3 border-t border-ca-outline-variant/30 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-body text-sm text-ca-on-surface-variant">테마</span>
                <ThemeToggle />
              </div>
              {!isCatalogRoute ? (
                <div className="space-y-1.5">
                  <p className="font-body text-xs font-medium text-ca-on-surface-variant">카탈로그 검색</p>
                  <HeaderCatalogSearch className="block lg:hidden" />
                </div>
              ) : null}
            </div>
          </details>
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
