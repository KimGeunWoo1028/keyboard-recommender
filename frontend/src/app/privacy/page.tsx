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
  title: "개인정보처리방침",
  description: "Keyboard Recommender 개인정보 수집·이용·보관·삭제에 관한 안내입니다.",
};

export default function PrivacyPage() {
  return (
    <PageShell className="max-w-3xl space-y-8 px-ca-margin-mobile pb-16 pt-8 sm:px-ca-margin sm:pb-20">
      <header className="space-y-2">
        <p className="font-label text-ca-label-sm font-medium text-ca-secondary">LEGAL</p>
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-ca-on-surface sm:text-3xl">
          개인정보처리방침
        </h1>
        <p className="text-sm text-ca-on-surface-variant">최종 업데이트: 2026-07-22</p>
      </header>

      <div className="space-y-8">
        <LegalSection title="1. 운영 주체">
          <p>
            Keyboard Recommender(이하 &quot;서비스&quot;)는 맞춤 키보드 조합 추천을 제공하는 웹 서비스입니다.
            본 방침은 서비스가 수집·이용하는 개인정보의 처리 기준을 설명합니다.
          </p>
        </LegalSection>

        <LegalSection title="2. 수집하는 정보">
          <ul className="list-disc space-y-1 pl-5">
            <li>계정: 이메일, 비밀번호(암호화 저장), 표시 이름</li>
            <li>서비스 이용: 설문 응답·추천 결과 스냅샷, 저장한 빌드(북마크), 계정 설정</li>
            <li>기기 로컬: 비로그인 이용 시 브라우저 저장소(예: localStorage)에 임시 결과·게스트 저장</li>
            <li>기술 로그: 보안·장애 대응을 위한 일반적인 접속·오류 로그(가능한 범위에서 최소화)</li>
          </ul>
        </LegalSection>

        <LegalSection title="3. 이용 목적">
          <ul className="list-disc space-y-1 pl-5">
            <li>회원가입·로그인·본인 확인(이메일 인증)</li>
            <li>추천 결과 제공 및 저장한 빌드 관리</li>
            <li>서비스 안정성·보안·오류 대응</li>
            <li>법령상 의무 이행</li>
          </ul>
        </LegalSection>

        <LegalSection title="4. 보관 및 삭제">
          <p>
            계정 정보는 회원 탈퇴 시 서비스 정책에 따라 삭제·비활성화됩니다. 기기 로컬에 저장된 게스트
            데이터는 해당 브라우저/기기에만 존재하며, 사용자가 직접 삭제하거나 브라우저 데이터를
            지우면 함께 삭제됩니다.
          </p>
        </LegalSection>

        <LegalSection title="5. 제3자 제공 및 외부 사이트">
          <p>
            서비스는 추천·카탈로그에서 스웨그키(Swagkey) 등 외부 판매 페이지로 연결할 수 있습니다.
            외부 사이트에서의 구매·결제·배송·개인정보 처리는 해당 사업자의 정책이 적용되며, 본
            서비스가 결제 정보를 직접 수집하지 않습니다.
          </p>
        </LegalSection>

        <LegalSection title="6. 이용자 권리">
          <p>
            계정 정보 확인·수정, 저장 빌드 관리, 회원 탈퇴는 마이페이지에서 진행할 수 있습니다.
            개인정보 관련 문의는{" "}
            <Link href="/contact" className="underline underline-offset-2 hover:text-ca-on-surface">
              문의
            </Link>{" "}
            페이지를 이용해 주세요.
          </p>
        </LegalSection>

        <LegalSection title="7. 방침 변경">
          <p>
            내용이 변경되면 본 페이지의 업데이트 일자를 갱신합니다. 중요한 변경이 있을 경우 서비스
            내 고지를 검토합니다.
          </p>
        </LegalSection>
      </div>

      <p className="text-sm text-ca-on-surface-variant">
        관련:{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-ca-on-surface">
          이용약관
        </Link>
        {" · "}
        <Link href="/contact" className="underline underline-offset-2 hover:text-ca-on-surface">
          문의
        </Link>
      </p>
    </PageShell>
  );
}
