import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-ca-outline-variant/30 bg-ca-surface-container-lowest/80">
      <div className="mx-auto flex w-full max-w-ca flex-col items-center justify-between gap-4 px-ca-margin-mobile py-8 md:flex-row md:px-ca-margin">
        <div className="flex flex-col items-center gap-1 md:items-start">
          <Link
            href="/"
            className="bg-gradient-to-r from-ca-primary to-ca-secondary bg-clip-text font-headline text-sm font-bold text-transparent"
          >
            Keyboard Recommender
          </Link>
          <p className="font-label text-ca-label-sm font-medium text-ca-on-surface-variant">
            © {year} Keyboard Recommender. Precision Crafted.
          </p>
        </div>

        <nav
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-label text-ca-label-sm font-medium text-ca-on-surface-variant"
          aria-label="푸터"
        >
          <Link href="/catalog" className="transition-colors hover:text-ca-on-surface">
            카탈로그
          </Link>
          <Link href="/recommend" className="transition-colors hover:text-ca-on-surface">
            추천 설문
          </Link>
          <Link href="/mypage" className="transition-colors hover:text-ca-on-surface">
            마이페이지
          </Link>
        </nav>
      </div>
    </footer>
  );
}
