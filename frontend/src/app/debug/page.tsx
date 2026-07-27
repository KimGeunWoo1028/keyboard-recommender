import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Debug home",
};

export default function DebugHomePage() {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-ca-on-surface-variant">
      <p className="section-label">Hub</p>
      <p className="font-headline text-lg font-bold text-ca-on-surface">도구를 선택하세요</p>
      <p>
        위 메뉴에서 도구를 고르세요. 모든 호출은 게이트된 FastAPI{" "}
        <code className="rounded-md border border-border bg-ca-surface-container-low px-1.5 py-0.5 font-mono text-xs">
          /api/v1/debug
        </code>{" "}
        라우트로 가며, 백엔드에서 활성화하지 않으면 동작하지 않습니다.
      </p>
    </div>
  );
}
