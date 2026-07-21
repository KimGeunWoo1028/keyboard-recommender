import type { ReactNode } from "react";

export function HomeWorkshopPreviewShell({ children }: { children: ReactNode }) {
  return (
    <div className="ca-glass-panel relative hidden min-h-[220px] overflow-hidden p-5 lg:block">
      <p className="font-label text-ca-label-sm font-medium text-ca-secondary">WORKSHOP PREVIEW</p>
      {children}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-ca-primary/20 blur-3xl"
        aria-hidden
      />
    </div>
  );
}

/** Light guest panel — safe to render on the server and on mobile (CSS-hidden under lg). */
export function HomeWorkshopGuestPreview() {
  return (
    <HomeWorkshopPreviewShell>
      <p className="mt-3 font-headline text-ca-headline-md text-ca-on-surface">취향 6축 · 부품 6축</p>
      <p className="mt-3 text-sm leading-relaxed text-ca-on-surface-variant">
        설문으로 소음·무게감·구분감·탄성·반발감·선명도를 잡고, 스위치부터 키캡까지 조합합니다.
      </p>
      <ul className="mt-4 space-y-1.5 font-label text-ca-label-sm text-ca-on-surface-variant">
        <li>추천 축 · 소음 · 무게감 · 구분감 · 탄성 · 반발감 · 선명도</li>
        <li>부품 축 · 스위치 · 플레이트 · 폼 · 레이아웃 · 케이스 · 키캡</li>
      </ul>
    </HomeWorkshopPreviewShell>
  );
}
