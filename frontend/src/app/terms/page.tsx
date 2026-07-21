import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { PageShell } from "@/components/layout/page-shell";

type LegalSectionProps = {
  title: string;
  children: ReactNode;
};

function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section className="space-y-2">
      <h2 className="font-headline text-lg font-semibold text-ca-on-surface">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-ca-on-surface-variant">{children}</div>
    </section>
  );
}

export const metadata: Metadata = {
  title: "이용약관",
  description: "Keyboard Recommender 서비스 이용에 관한 약관입니다.",
};

export default function TermsPage() {
  return (
    <PageShell className="max-w-3xl space-y-8 px-ca-margin-mobile pb-16 pt-8 sm:px-ca-margin sm:pb-20">
      <header className="space-y-2">
        <p className="font-label text-ca-label-sm font-medium text-ca-secondary">LEGAL</p>
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-ca-on-surface sm:text-3xl">
          이용약관
        </h1>
        <p className="text-sm text-ca-on-surface-variant">최종 업데이트: 2026-07-22</p>
      </header>

      <div className="space-y-8">
        <LegalSection title="1. 서비스 소개">
          <p>
            Keyboard Recommender는 설문 기반 취향 정보를 바탕으로 커스텀 키보드 부품 조합을
            추천하고, 카탈로그에서 관련 제품을 탐색할 수 있게 돕는 서비스입니다. 완제품 쇼핑몰이나
            결제 대행 서비스가 아닙니다.
          </p>
        </LegalSection>

        <LegalSection title="2. 계정">
          <p>
            일부 기능(계정 저장·마이페이지 등)은 회원가입이 필요할 수 있습니다. 계정 정보는
            정확하게 제공해야 하며, 비밀번호 관리 책임은 이용자에게 있습니다. 회원 탈퇴는
            마이페이지에서 요청할 수 있습니다.
          </p>
        </LegalSection>

        <LegalSection title="3. 추천 및 카탈로그">
          <p>
            추천 결과는 이용자의 설문 응답과 서비스가 보유한 카탈로그·특성 정보를 바탕으로 한
            참고용 제안입니다. 실제 타건감·소음·호환성·품질은 개인·환경·제품 상태에 따라 달라질 수
            있으며, 특정 결과나 구매 만족을 보장하지 않습니다.
          </p>
          <p>
            카탈로그 정보·이미지·링크는 외부 판매처(현재 주로 스웨그키) 공개 정보를 참고해
            구성될 수 있으며, 최신성·정확성이 실시간으로 보장되지 않을 수 있습니다.
          </p>
        </LegalSection>

        <LegalSection title="4. 외부 구매·가격·재고">
          <p>
            서비스에서 표시되는 구매 링크는 외부 사이트로 이동합니다. 가격, 재고, 배송, 환불,
            A/S는 해당 판매처 기준이며, 본 서비스 화면에 가격·재고가 없거나 시점 정보가 없을 수
            있습니다. 구매 전 판매처에서 최종 확인하세요.
          </p>
          <p>
            서비스는 스웨그키 판매 상품과의 탐색·추천 연결을 제공합니다. 제휴·광고 관계가
            변경될 수 있으며, 관련 고지는 서비스 화면 및{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-ca-on-surface">
              개인정보처리방침
            </Link>
            과 함께 확인할 수 있습니다.
          </p>
        </LegalSection>

        <LegalSection title="5. 금지 행위">
          <ul className="list-disc space-y-1 pl-5">
            <li>서비스·계정·API에 대한 무단 접근·남용·자동화 공격</li>
            <li>타인의 권리·법령을 침해하는 이용</li>
            <li>서비스 운영을 방해하는 행위</li>
          </ul>
        </LegalSection>

        <LegalSection title="6. 면책">
          <p>
            천재지변, 외부 판매처 장애, 네트워크 문제 등 합리적 통제 범위를 넘는 사유로 인한
            서비스 중단·데이터 손실에 대해 법령이 허용하는 범위에서 책임을 제한합니다. 외부
            구매로 인한 분쟁은 해당 판매처와 이용자 사이에서 해결합니다.
          </p>
        </LegalSection>

        <LegalSection title="7. 문의">
          <p>
            약관·서비스 관련 문의는{" "}
            <Link href="/contact" className="underline underline-offset-2 hover:text-ca-on-surface">
              문의
            </Link>{" "}
            페이지를 이용해 주세요.
          </p>
        </LegalSection>
      </div>

      <p className="text-sm text-ca-on-surface-variant">
        관련:{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-ca-on-surface">
          개인정보처리방침
        </Link>
        {" · "}
        <Link href="/contact" className="underline underline-offset-2 hover:text-ca-on-surface">
          문의
        </Link>
      </p>
    </PageShell>
  );
}
