"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const pathname = usePathname() ?? "/";
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
    <footer className="mt-auto border-t border-ca-outline-variant/30 bg-ca-surface-container-lowest/80">
      <div className="mx-auto flex w-full max-w-ca flex-col items-center justify-between gap-4 px-ca-margin-mobile py-8 md:flex-row md:px-ca-margin">
        <div className="flex flex-col items-center gap-1 md:items-start">
          <Link
            href="/"
            prefetch={deferNavPrefetch ? false : undefined}
            className="font-headline text-sm font-bold text-ca-on-surface"
          >
            Keyboard Recommender
          </Link>
          <p className="font-label text-ca-label-sm font-medium text-ca-on-surface-variant">
            © {year} Keyboard Recommender
          </p>
        </div>

        <nav
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-label text-ca-label-sm font-medium text-ca-on-surface-variant"
          aria-label="푸터"
        >
          <Link href="/catalog" prefetch={deferNavPrefetch ? false : undefined} className="transition-colors hover:text-ca-on-surface">
            카탈로그
          </Link>
          <Link href="/recommend" prefetch={deferNavPrefetch ? false : undefined} className="transition-colors hover:text-ca-on-surface">
            설문
          </Link>
          <Link href="/mypage" prefetch={deferNavPrefetch ? false : undefined} className="transition-colors hover:text-ca-on-surface">
            마이페이지
          </Link>
          <Link href="/privacy" prefetch={false} className="transition-colors hover:text-ca-on-surface">
            개인정보처리방침
          </Link>
          <Link href="/terms" prefetch={false} className="transition-colors hover:text-ca-on-surface">
            이용약관
          </Link>
          <Link href="/contact" prefetch={false} className="transition-colors hover:text-ca-on-surface">
            문의
          </Link>
        </nav>
      </div>
    </footer>
  );
}
