import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { buttonClassName } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "문의",
  description: "Keyboard Recommender 이용·오류·개인정보 관련 문의 안내입니다.",
};

function resolveContactEmail(): string | null {
  const raw = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "";
  if (!raw) return null;
  // Never ship test/placeholder inboxes on the public contact page.
  if (/test/i.test(raw) || /example\.com$/i.test(raw) || /@localhost$/i.test(raw)) {
    return null;
  }
  return raw;
}

export default function ContactPage() {
  const contactEmail = resolveContactEmail();
  const mailto = contactEmail
    ? `mailto:${contactEmail}?subject=${encodeURIComponent("[Keyboard Recommender] 문의")}`
    : null;

  return (
    <PageShell className="max-w-3xl space-y-8 px-ca-margin-mobile pb-16 pt-8 sm:px-ca-margin sm:pb-20">
      <header className="space-y-2">
        <p className="font-label text-ca-label-sm font-medium text-ca-secondary">SUPPORT</p>
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-ca-on-surface sm:text-3xl">
          문의
        </h1>
        <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
          서비스 이용, 오류 제보, 계정·개인정보 관련 요청은 아래로 문의해 주세요. 영업일 기준으로 확인합니다.
        </p>
      </header>

      <div className="space-y-4 rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest p-5 sm:p-6">
        {contactEmail && mailto ? (
          <>
            <div className="space-y-1">
              <p className="text-sm font-medium text-ca-on-surface">이메일</p>
              <a
                href={mailto}
                className="break-all text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline"
              >
                {contactEmail}
              </a>
            </div>
            <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant">
              문의 시 사용 중인 페이지 URL, 발생 시각, 가능하면 스크린샷을 함께 보내 주시면 더 빠르게 확인할 수 있습니다.
            </p>
            <a href={mailto} className={buttonClassName({ size: "default" })}>
              이메일 보내기
            </a>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-sm font-medium text-ca-on-surface">이메일</p>
              <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant">
                운영 문의 주소가 아직 공개 설정되지 않았습니다. 잠시 후 다시 확인하거나, 서비스 내 다른 안내 채널이 열리면 그 경로를 이용해 주세요.
              </p>
            </div>
            {process.env.NODE_ENV === "development" ? (
              <p className="break-keep rounded-lg border border-ca-outline-variant/50 bg-ca-surface-container/40 px-3 py-2 text-xs text-ca-on-surface-variant">
                개발 안내: `frontend/.env.local`에 `NEXT_PUBLIC_CONTACT_EMAIL`을 설정한 뒤 개발 서버를 다시 시작하세요. 테스트·example.com 주소는 화면에 노출되지 않습니다.
              </p>
            ) : null}
          </>
        )}
      </div>

      <p className="text-sm text-ca-on-surface-variant">
        관련:{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-ca-on-surface">
          개인정보처리방침
        </Link>
        {" · "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-ca-on-surface">
          이용약관
        </Link>
      </p>
    </PageShell>
  );
}
