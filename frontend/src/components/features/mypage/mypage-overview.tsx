"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { AuthUser } from "@/lib/api/auth";
import type { SavedRecommendationItem } from "@/lib/api/saved-recommendations";
import { resolveAvatarSrc } from "@/lib/avatar";
import { loadLastKnownGoodSubmission } from "@/lib/survey-storage";
import { buttonClassName } from "@/components/ui/button";
import { buildStackParts } from "@/components/features/mypage/mypage-build-stack";
import {
  fixedAxisBarGlyph,
  fixedAxisBars,
  TRAIT_MINI_PROFILE_MICROCOPY,
} from "@/components/features/recommendation/results/results-trait-display";

type Props = {
  user: AuthUser;
  savedItems: SavedRecommendationItem[];
};

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

/** Short list-style title: drop "추천 조합:" and English parentheticals. */
function shortTitle(item: SavedRecommendationItem): string {
  let title = (item.title || item.build_id).trim();
  title = title.replace(/^추천\s*조합\s*:\s*/i, "");
  title = title.replace(/\s*\([^)]*\)/g, "");
  title = title.replace(/\s{2,}/g, " ").replace(/\s·\s/g, " · ").trim();
  return title || item.build_id;
}

function shortTitleLines(item: SavedRecommendationItem): [string, string?] {
  const title = shortTitle(item);
  const parts = title
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts.slice(1).join(" · ")];
  return [title];
}

export function MyPageOverview({ user, savedItems }: Props) {
  const display = user.display_name?.trim() || user.email;
  const avatarSrc = resolveAvatarSrc(user.avatar_url);
  const latestSaved = useMemo(() => pickLatestSaved(savedItems), [savedItems]);
  const [mounted, setMounted] = useState(false);
  const [localPreference, setLocalPreference] = useState<LocalPreference>({
    scores: null,
    recommendedAt: null,
  });

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

  const fromSavedScores = latestSaved ? readTraitScoresFromMetadata(latestSaved.metadata) : null;
  const scores = localPreference.scores ?? fromSavedScores;
  const recommendedAt =
    localPreference.recommendedAt ??
    (typeof latestSaved?.metadata?.recommendedAt === "string"
      ? latestSaved.metadata.recommendedAt
      : latestSaved?.saved_at ?? null);

  const bars = scores ? fixedAxisBars(scores) : [];
  const relative = mounted ? formatRelativeKo(recommendedAt ?? undefined) : null;
  const stackParts = latestSaved ? buildStackParts(latestSaved) : [];
  const switchPart = stackParts.find((part) => part.key === "switches" || part.key === "switch");
  const secondaryPart = stackParts.find((part) => part.key === "plate") ?? stackParts.find((part) => part.key === "layout");
  const hasRecommendationHint = Boolean(recommendedAt) || Boolean(scores);
  const [titleLine1, titleLine2] = latestSaved ? shortTitleLines(latestSaved) : ["", undefined];

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <article className="flex h-full min-h-[22rem] flex-col overflow-hidden rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest sm:min-h-[24rem]">
        <div className="border-b border-ca-outline-variant/30 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-center justify-between gap-5 sm:gap-8">
            <div className="min-w-0 flex-1">
              <h2 className="font-headline text-xl font-semibold tracking-tight text-ca-on-surface sm:text-2xl">
                {display}
              </h2>
              {relative ? (
                <p className="mt-2 text-sm text-ca-on-surface-variant">마지막 추천 · {relative}</p>
              ) : hasRecommendationHint ? (
                <p className="mt-2 text-sm text-ca-on-surface-variant">마지막 추천 기록이 있습니다.</p>
              ) : (
                <p className="mt-2 text-sm text-ca-on-surface-variant">아직 추천 기록이 없습니다.</p>
              )}
              <Link
                href="/recommend"
                prefetch={false}
                className={buttonClassName({ variant: "primary", size: "sm", className: "mt-5" })}
              >
                다시 설문하기
              </Link>
            </div>
            <div
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-ca-outline-variant/50 bg-ca-surface-container/60 sm:h-28 sm:w-28"
              aria-label="프로필 사진"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- remote API avatar + local default; LCP on /mypage */}
              <img
                src={avatarSrc}
                alt=""
                width={112}
                height={112}
                className="h-full w-full object-cover"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h3 className="font-headline text-base font-semibold text-ca-on-surface">취향 스냅샷</h3>
          <p className="mt-1 break-keep text-sm leading-relaxed text-ca-on-surface-variant">
            {TRAIT_MINI_PROFILE_MICROCOPY}
          </p>
          {bars.length ? (
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
              {bars.map((bar) => (
                <div key={bar.id} className="flex min-w-0 items-center gap-2 text-sm">
                  <span className="w-12 shrink-0 font-medium text-ca-on-surface">{bar.label}</span>
                  <span
                    className="text-sm leading-none tracking-tight text-ca-on-surface-variant"
                    aria-label={`${bar.label} ${bar.filledSegments}/5`}
                  >
                    {fixedAxisBarGlyph(bar.filledSegments)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-ca-outline-variant/50 p-4 text-sm text-ca-on-surface-variant">
              설문으로 취향을 만들면 여기에 6축 스냅샷이 표시됩니다.
              <Link
                href="/recommend"
                prefetch={false}
                className="mt-2 block text-sm font-medium text-ca-primary hover:underline"
              >
                설문으로 취향 만들기 →
              </Link>
            </div>
          )}
        </div>
      </article>

      <div className="flex h-full min-h-[22rem] flex-col rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest p-5 sm:min-h-[24rem] sm:p-6">
        <h3 className="font-headline text-base font-semibold text-ca-on-surface">저장한 빌드</h3>
        <p className="mt-3 font-headline text-3xl font-semibold tabular-nums tracking-tight text-ca-on-surface">
          {savedItems.length}
        </p>
        <p className="mt-1 text-sm text-ca-on-surface-variant">저장된 추천 빌드</p>

        <div className="mt-5 flex-1 border-t border-ca-outline-variant/30 pt-5">
          {latestSaved ? (
            <div className="space-y-2.5">
              <p className="text-sm font-medium text-ca-on-surface-variant">최근 저장</p>
              <div>
                <p className="font-headline text-base font-semibold leading-snug text-ca-on-surface">{titleLine1}</p>
                {titleLine2 ? (
                  <p className="font-headline text-base font-semibold leading-snug text-ca-on-surface">{titleLine2}</p>
                ) : null}
              </div>
              {switchPart ? (
                <p className="text-sm text-ca-on-surface-variant">
                  <span className="font-medium text-ca-on-surface">스위치 · </span>
                  {switchPart.name}
                </p>
              ) : null}
              {secondaryPart ? (
                <p className="text-sm text-ca-on-surface-variant">
                  <span className="font-medium text-ca-on-surface">{secondaryPart.label} · </span>
                  {secondaryPart.name}
                </p>
              ) : null}
            </div>
          ) : hasRecommendationHint ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-ca-on-surface-variant">최근 결과 (이 브라우저)</p>
              <p className="break-keep text-sm leading-relaxed text-ca-on-surface-variant">
                {relative
                  ? `이 기기에 ${relative} 설문 결과가 있습니다. 계정 저장 목록에는 아직 없습니다.`
                  : "이 기기에 설문 결과가 있습니다. 계정 저장 목록에는 아직 없습니다."}
              </p>
              <Link
                href="/results"
                prefetch={false}
                className="inline-block text-sm font-medium text-ca-primary hover:underline"
              >
                최근 결과 열기 →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-ca-on-surface-variant">
                아직 저장한 빌드가 없습니다. 결과에서 「이 빌드 저장」을 누르면 여기에 모입니다.
              </p>
              <Link
                href="/recommend"
                prefetch={false}
                className="inline-block text-sm font-medium text-ca-primary hover:underline"
              >
                설문 시작하기 →
              </Link>
            </div>
          )}
        </div>

        <Link
          href="/mypage?section=saved"
          className="mt-5 self-start text-sm font-medium text-ca-primary hover:underline"
        >
          저장 목록 보기 →
        </Link>
        <Link
          href="/results"
          prefetch={false}
          className="mt-2 self-start text-sm font-medium text-ca-on-surface-variant underline-offset-4 hover:text-ca-on-surface hover:underline"
        >
          이 브라우저의 최근 결과 보기 →
        </Link>
        <p className="mt-3 break-keep text-xs leading-relaxed text-ca-on-surface-variant">
          별도 북마크·히스토리 페이지는 없습니다. 저장한 빌드와 이 브라우저의 최근 결과가 재방문 기록입니다.
        </p>
      </div>
    </div>
  );
}
