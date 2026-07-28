import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/features/contact/contact-form";
import { ManusPageHeader } from "@/components/layout/manus-page-header";
import { ManusSurfaceCard } from "@/components/layout/manus-surface-card";
import { PageShell } from "@/components/layout/page-shell";
import { buttonClassName } from "@/components/ui/button";
import { publicPageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = publicPageMetadata({
  path: "/contact",
  title: "문의",
  description: "Keyboard Recommender 이용·오류·개인정보 관련 문의 안내입니다.",
});

function resolveContactEmail(): string | null {
  const raw = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "";
  if (!raw) return null;
  if (/test/i.test(raw) || /example\.com$/i.test(raw) || /@localhost$/i.test(raw)) {
    return null;
  }
  return raw;
}

function buildMailto(email: string): string {
  const subject = encodeURIComponent("[Keyboard Recommender] 문의");
  const body = encodeURIComponent(
    [
      "이름:",
      "연락 가능한 이메일:",
      "관련 페이지 URL:",
      "발생 시각:",
      "증상 요약:",
      "",
      "(가능하면 스크린샷을 첨부해 주세요.)",
    ].join("\n"),
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export default function ContactPage() {
  const contactEmail = resolveContactEmail();
  const mailto = contactEmail ? buildMailto(contactEmail) : null;

  return (
    <PageShell className="max-w-3xl space-y-8 px-ca-margin-mobile pb-16 pt-8 sm:px-ca-margin sm:pb-20">
      <ManusPageHeader
        eyebrow="Support"
        title="문의"
        description="서비스 이용, 오류 제보, 계정·개인정보 관련 요청은 아래 폼으로 보내 주세요. 영업일 2일 내 회신을 목표로 합니다."
      />

      <ManusSurfaceCard className="animate-fade-up space-y-4" padding="lg">
        <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant" data-testid="e2e-contact-sla">
          회신 SLA: 영업일 2일 내 회신을 목표로 확인합니다. 문의 시 페이지 URL·발생 시각·스크린샷을 함께 주시면 더
          빠르게 확인할 수 있습니다.
        </p>
        <ContactForm />
      </ManusSurfaceCard>

      {contactEmail && mailto ? (
        <ManusSurfaceCard className="animate-fade-up space-y-3" padding="lg">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-ca-on-surface-variant">이메일 (대안)</p>
            <a
              href={mailto}
              className="break-all text-sm font-semibold text-primary underline-offset-4 hover:underline"
              data-testid="e2e-contact-mailto"
            >
              {contactEmail}
            </a>
          </div>
          <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant">
            메일 앱이 열리면 제목·본문 템플릿이 미리 채워집니다. 폼 전송이 어려울 때 사용해 주세요.
          </p>
          <a href={mailto} className={buttonClassName({ variant: "outline", className: "h-11 font-semibold" })}>
            이메일 앱으로 보내기
          </a>
        </ManusSurfaceCard>
      ) : null}

      <p className="text-sm text-ca-on-surface-variant">
        관련:{" "}
        <Link href="/privacy" className="font-medium text-primary underline-offset-2 hover:underline">
          개인정보처리방침
        </Link>
        {" · "}
        <Link href="/terms" className="font-medium text-primary underline-offset-2 hover:underline">
          이용약관
        </Link>
      </p>
    </PageShell>
  );
}
