import type { Metadata } from "next";
import Link from "next/link";

import { ManusPageHeader } from "@/components/layout/manus-page-header";
import { ManusSecondaryShell } from "@/components/layout/manus-secondary-shell";
import { ManusSurfaceCard } from "@/components/layout/manus-surface-card";
import { buttonClassName } from "@/components/ui/button";
import { decodeShareTaste } from "@/lib/share-taste";
import { publicPageMetadata } from "@/lib/seo/page-metadata";

type Props = {
  searchParams: Promise<{ t?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const taste = sp.t ? decodeShareTaste(sp.t) : null;
  const title = taste?.title ? `취향 카드 · ${taste.title}` : "취향 카드";
  return publicPageMetadata({
    path: "/share",
    title,
    description: "설문으로 찾은 키보드 취향 요약을 공유한 페이지입니다. 개인 결과는 포함되지 않습니다.",
  });
}

export default async function SharePage({ searchParams }: Props) {
  const sp = await searchParams;
  const taste = sp.t ? decodeShareTaste(sp.t) : null;

  return (
    <ManusSecondaryShell>
      <ManusPageHeader
        eyebrow="Share"
        title="취향 카드"
        description="개인 추천 결과 전체가 아니라, 공유용 취향 요약만 보여 줍니다."
      />

      <ManusSurfaceCard className="animate-fade-up space-y-4" padding="lg">
        <div data-testid="e2e-share-card" className="space-y-4">
        {taste ? (
          <>
            <h2 className="font-headline text-xl font-extrabold text-ca-on-surface">{taste.title}</h2>
            {taste.tags.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5" aria-label="취향 태그">
                {taste.tags.map((tag) => (
                  <li key={tag} className="ca-keycap-badge">
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
            {taste.why ? (
              <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant">{taste.why}</p>
            ) : null}
            <p className="break-keep text-xs text-ca-on-surface-variant">
              이 링크에는 계정·이메일·상세 부품 목록이 포함되지 않습니다.
            </p>
          </>
        ) : (
          <p className="break-keep text-sm text-ca-on-surface-variant">
            유효한 공유 링크가 아니거나 만료된 요약입니다. 설문으로 나만의 조합을 찾아 보세요.
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/recommend" className={buttonClassName({ className: "h-11 font-semibold" })}>
            설문 시작
          </Link>
          <Link
            href="/catalog"
            className={buttonClassName({ variant: "outline", className: "h-11 font-semibold" })}
          >
            카탈로그 보기
          </Link>
        </div>
        </div>
      </ManusSurfaceCard>
    </ManusSecondaryShell>
  );
}
