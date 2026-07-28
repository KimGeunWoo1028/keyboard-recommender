"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getCopyrightYear } from "@/lib/date-time";

export function SiteFooter() {
  const year = getCopyrightYear();
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
    <footer className="mt-auto bg-[rgb(15_15_25)] text-white dark:bg-ca-surface-container-lowest">
      <div className="mx-auto w-full max-w-ca px-ca-margin-mobile py-12 md:px-ca-margin">
        <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                K
              </span>
              <span className="text-sm font-bold">Keyboard Recommender</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/60">
              취향에 맞는 키보드 부품 조합을 1분 설문으로 찾아드립니다.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">서비스</h2>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/recommend"
                  prefetch={deferNavPrefetch ? false : undefined}
                  className="inline-flex min-h-11 items-center text-sm text-white/70 transition-colors hover:text-white"
                >
                  추천 설문
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog"
                  prefetch={deferNavPrefetch ? false : undefined}
                  className="inline-flex min-h-11 items-center text-sm text-white/70 transition-colors hover:text-white"
                >
                  부품 카탈로그
                </Link>
              </li>
              <li>
                <Link
                  href="/mypage"
                  prefetch={deferNavPrefetch ? false : undefined}
                  className="inline-flex min-h-11 items-center text-sm text-white/70 transition-colors hover:text-white"
                >
                  마이페이지
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">정보</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" prefetch={false} className="inline-flex min-h-11 items-center text-sm text-white/70 transition-colors hover:text-white">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/terms" prefetch={false} className="inline-flex min-h-11 items-center text-sm text-white/70 transition-colors hover:text-white">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/contact" prefetch={false} className="inline-flex min-h-11 items-center text-sm text-white/70 transition-colors hover:text-white">
                  문의
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/40">© {year} Keyboard Recommender. All rights reserved.</p>
          <p className="text-xs text-white/40">취향에 맞는 키보드 조합을 찾아드립니다</p>
        </div>
      </div>
    </footer>
  );
}
