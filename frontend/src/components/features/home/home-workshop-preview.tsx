"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  HomeWorkshopGuestPreview,
  HomeWorkshopPreviewShell,
} from "@/components/features/home/home-workshop-guest-preview";
import { useAuthHeader } from "@/components/layout/auth-controls";
import { fixedAxisBars } from "@/components/features/recommendation/results/results-trait-display";
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

function EmptyLoggedInPreview({ recommendHref }: { recommendHref: string }) {
  return (
    <HomeWorkshopPreviewShell>
      <p className="font-headline text-base font-semibold text-ca-on-surface sm:text-lg">
        아직 추천 기록이 없어요
      </p>
      <p className="mt-2 break-keep text-sm leading-relaxed text-ca-on-surface-variant sm:text-base">
        설문으로 첫 조합을 받아 보세요. 저장한 빌드는 마이페이지에서 관리합니다.
      </p>
      <Link
        href={recommendHref}
        className="mt-5 inline-block text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline"
      >
        설문으로 첫 추천 받기
      </Link>
    </HomeWorkshopPreviewShell>
  );
}

/**
 * Below-fold experience panel — personalized when logged in; honest static summary when guest.
 * Data sources unchanged; presentation stays thin (Home IA: not a dashboard).
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
    return <HomeWorkshopGuestPreview />;
  }

  if (!user) {
    return <HomeWorkshopGuestPreview />;
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
      <HomeWorkshopPreviewShell>
        <p className="font-headline text-base font-semibold text-ca-on-surface sm:text-lg">불러오는 중</p>
        <p className="mt-2 text-sm text-ca-on-surface-variant">잠시만 기다려 주세요.</p>
      </HomeWorkshopPreviewShell>
    );
  }

  if (!hasTraits && !hasSaved) {
    return <EmptyLoggedInPreview recommendHref={recommendHref} />;
  }

  return (
    <HomeWorkshopPreviewShell>
      <p className="font-headline text-base font-semibold text-ca-on-surface sm:text-lg">이어서 보기</p>
      {relative ? (
        <p className="mt-1.5 text-sm text-ca-on-surface-variant">마지막 추천 · {relative}</p>
      ) : hasTraits ? (
        <p className="mt-1.5 text-sm text-ca-on-surface-variant">취향 설문이 준비되어 있어요.</p>
      ) : null}

      {hasSaved && latestSaved ? (
        <div className="mt-4 border-t border-ca-outline-variant/35 pt-4">
          <p className="text-sm text-ca-on-surface-variant">최근 저장</p>
          <Link
            href="/mypage?section=saved"
            prefetch={false}
            className="mt-1.5 block line-clamp-2 font-headline text-sm font-semibold leading-snug text-ca-on-surface underline-offset-4 hover:underline"
          >
            {shortTitle(latestSaved)}
          </Link>
        </div>
      ) : null}

      {!hasTraits && hasSaved ? (
        <Link
          href={recommendHref}
          prefetch={user ? undefined : false}
          className="mt-4 inline-block text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline"
        >
          설문으로 취향 잡기
        </Link>
      ) : null}

      {hasTraits && !hasSaved ? (
        <Link
          href="/results"
          prefetch={false}
          className="mt-4 inline-block text-sm font-medium text-ca-on-surface underline-offset-4 hover:underline"
        >
          최근 결과 열기
        </Link>
      ) : null}
    </HomeWorkshopPreviewShell>
  );
}
