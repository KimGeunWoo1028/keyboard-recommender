"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { useAuthHeader } from "@/components/layout/auth-controls";
import {
  fixedAxisBarGlyph,
  fixedAxisBars,
} from "@/components/features/recommendation/results/results-trait-display";
import {
  listSavedBookmarksWithLocalFallback,
  type SavedRecommendationItem,
} from "@/lib/api/saved-recommendations";
import { loadLastKnownGoodSubmission } from "@/lib/survey-storage";

type LocalPreference = {
  scores: Record<string, number> | null;
  recommendedAt: string | null;
};

function formatRelativeKo(iso?: string): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  const diffMs = Date.now() - parsed.getTime();
  if (diffMs < 0) return "방금";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}주 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

function readTraitScoresFromMetadata(meta: Record<string, unknown> | undefined): Record<string, number> | null {
  const raw = meta?.userTraitScores;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
  }
  return Object.keys(out).length ? out : null;
}

function pickLatestSaved(items: SavedRecommendationItem[]): SavedRecommendationItem | null {
  if (!items.length) return null;
  return [...items].sort((a, b) => +new Date(b.saved_at) - +new Date(a.saved_at))[0] ?? null;
}

function shortTitle(item: SavedRecommendationItem): string {
  let title = (item.title || item.build_id).trim();
  title = title.replace(/^추천\s*조합\s*:\s*/i, "");
  title = title.replace(/\s*\([^)]*\)/g, "");
  title = title.replace(/\s{2,}/g, " ").replace(/\s·\s/g, " · ").trim();
  return title || item.build_id;
}

function PreviewShell({ children }: { children: ReactNode }) {
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

function GuestPreview() {
  return (
    <PreviewShell>
      <p className="mt-3 font-headline text-ca-headline-md text-ca-on-surface">취향 6축 · 부품 6축</p>
      <p className="mt-3 text-sm leading-relaxed text-ca-on-surface-variant">
        설문으로 소음·무게감·구분감·탄성·반발감·선명도를 잡고, 스위치부터 키캡까지 조합합니다.
      </p>
      <ul className="mt-4 space-y-1.5 font-label text-ca-label-sm text-ca-on-surface-variant">
        <li>추천 축 · 소음 · 무게감 · 구분감 · 탄성 · 반발감 · 선명도</li>
        <li>부품 축 · 스위치 · 플레이트 · 폼 · 레이아웃 · 케이스 · 키캡</li>
      </ul>
    </PreviewShell>
  );
}

function EmptyLoggedInPreview({ recommendHref }: { recommendHref: string }) {
  return (
    <PreviewShell>
      <p className="mt-3 font-headline text-ca-headline-md text-ca-on-surface">아직 추천 기록이 없어요</p>
      <p className="mt-3 text-sm leading-relaxed text-ca-on-surface-variant">
        설문으로 첫 추천을 받아보세요. 취향 스냅샷과 저장 빌드가 여기에 나타납니다.
      </p>
      <Link
        href={recommendHref}
        className="mt-5 inline-block font-label text-ca-label-sm font-medium text-ca-primary hover:underline"
      >
        설문으로 첫 추천 받기 →
      </Link>
    </PreviewShell>
  );
}

/**
 * Hero right panel — personalized when logged in; honest static summary when guest.
 * Reuses the same local trait + saved-bookmark sources as mypage overview.
 */
export function HomeWorkshopPreview() {
  const { user, authChecked } = useAuthHeader();
  const [mounted, setMounted] = useState(false);
  const [localPreference, setLocalPreference] = useState<LocalPreference>({
    scores: null,
    recommendedAt: null,
  });
  const [latestSaved, setLatestSaved] = useState<SavedRecommendationItem | null>(null);
  const [savedReady, setSavedReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    const lastGood = loadLastKnownGoodSubmission();
    const fromLastGood = lastGood?.userTraitScores;
    if (fromLastGood && Object.keys(fromLastGood).length > 0) {
      setLocalPreference({
        scores: fromLastGood,
        recommendedAt: lastGood?.completedAtIso ?? null,
      });
      return;
    }
    setLocalPreference({ scores: null, recommendedAt: lastGood?.completedAtIso ?? null });
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      setLatestSaved(null);
      setSavedReady(true);
      return;
    }
    let cancelled = false;
    setSavedReady(false);
    void listSavedBookmarksWithLocalFallback({ limit: 20 })
      .then((items) => {
        if (!cancelled) setLatestSaved(pickLatestSaved(items));
      })
      .catch(() => {
        if (!cancelled) setLatestSaved(null);
      })
      .finally(() => {
        if (!cancelled) setSavedReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [authChecked, user]);

  const recommendHref = user ? "/recommend" : "/auth?next=/recommend";

  // Auth still resolving — keep guest summary to avoid fake "active" flash.
  if (!authChecked) {
    return <GuestPreview />;
  }

  if (!user) {
    return <GuestPreview />;
  }

  const fromSavedScores = latestSaved ? readTraitScoresFromMetadata(latestSaved.metadata) : null;
  const scores = localPreference.scores ?? fromSavedScores;
  const bars = scores ? fixedAxisBars(scores) : [];
  const recommendedAt =
    localPreference.recommendedAt ??
    (typeof latestSaved?.metadata?.recommendedAt === "string"
      ? latestSaved.metadata.recommendedAt
      : latestSaved?.saved_at ?? null);
  const relative = mounted ? formatRelativeKo(recommendedAt ?? undefined) : null;
  const hasTraits = bars.length > 0;
  const hasSaved = Boolean(latestSaved);
  const dataPending = !savedReady && !hasTraits;

  if (dataPending) {
    return (
      <PreviewShell>
        <p className="mt-3 font-headline text-ca-headline-md text-ca-on-surface">내 워크스페이스</p>
        <p className="mt-3 text-sm text-ca-on-surface-variant">불러오는 중…</p>
      </PreviewShell>
    );
  }

  if (!hasTraits && !hasSaved) {
    return <EmptyLoggedInPreview recommendHref={recommendHref} />;
  }

  return (
    <PreviewShell>
      <p className="mt-3 font-headline text-ca-headline-md text-ca-on-surface">내 워크스페이스</p>
      {relative ? (
        <p className="mt-1.5 text-sm text-ca-on-surface-variant">마지막 추천 · {relative}</p>
      ) : null}

      {hasTraits ? (
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2">
          {bars.map((bar) => (
            <div key={bar.id} className="flex min-w-0 items-center gap-1.5 text-xs sm:text-sm">
              <span className="w-10 shrink-0 font-medium text-ca-on-surface sm:w-12">{bar.label}</span>
              <span
                className="font-label text-[10px] leading-none tracking-tight text-ca-secondary sm:text-xs"
                aria-label={`${bar.label} ${bar.filledSegments}/5`}
              >
                {fixedAxisBarGlyph(bar.filledSegments)}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {hasSaved && latestSaved ? (
        <div className={`${hasTraits ? "mt-4 border-t border-ca-outline-variant/30 pt-4" : "mt-4"}`}>
          <p className="font-label text-ca-label-sm font-medium text-ca-secondary">최근 저장</p>
          <Link
            href="/mypage?section=saved"
            className="mt-1.5 block line-clamp-2 font-headline text-sm font-semibold leading-snug text-ca-on-surface underline-offset-4 hover:underline"
          >
            {shortTitle(latestSaved)}
          </Link>
        </div>
      ) : null}

      {!hasTraits && hasSaved ? (
        <Link
          href={recommendHref}
          className="mt-4 inline-block font-label text-ca-label-sm font-medium text-ca-primary hover:underline"
        >
          설문으로 취향 스냅샷 만들기 →
        </Link>
      ) : null}
    </PreviewShell>
  );
}
