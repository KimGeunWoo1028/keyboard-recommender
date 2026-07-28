"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { AuthUser } from "@/lib/api/auth";
import type { SavedRecommendationItem } from "@/lib/api/saved-recommendations";
import { formatRelativeKo, toEpochMs } from "@/lib/date-time";
import { loadLastKnownGoodSubmission } from "@/lib/survey-storage";
import { buttonClassName } from "@/components/ui/button";
import { buildStackParts } from "@/components/features/mypage/mypage-build-stack";
import {
  savedMatchPercent,
  savedPreferenceTags,
  shortSavedTitleLines,
} from "@/components/features/mypage/mypage-saved-identity";
import { fixedAxisSummaryRows } from "@/components/features/recommendation/results/results-trait-display";

type Props = {
  user: AuthUser;
  savedItems: SavedRecommendationItem[];
};

type LocalPreference = {
  scores: Record<string, number> | null;
  recommendedAt: string | null;
  overallConfidence: number | null;
};

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
  return [...items].sort((a, b) => toEpochMs(b.saved_at) - toEpochMs(a.saved_at))[0] ?? null;
}

function bestMatchPercent(items: SavedRecommendationItem[], localConfidence: number | null): number | null {
  const fromSaved = items
    .map((item) => savedMatchPercent(item))
    .filter((value): value is number => value !== null);
  if (fromSaved.length) return Math.max(...fromSaved);
  if (localConfidence !== null && Number.isFinite(localConfidence)) {
    return Math.max(0, Math.min(100, Math.round(localConfidence * 100)));
  }
  return null;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border-2 border-[rgb(220_220_238)] bg-white p-5 dark:border-border dark:bg-ca-surface-container">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[rgb(130_130_150)] dark:text-ca-on-surface-variant">
        {label}
      </p>
      <p className="font-headline text-3xl font-extrabold tabular-nums text-primary">{value}</p>
    </div>
  );
}

export function MyPageOverview({ user: _user, savedItems }: Props) {
  const latestSaved = useMemo(() => pickLatestSaved(savedItems), [savedItems]);
  const [mounted, setMounted] = useState(false);
  const [localPreference, setLocalPreference] = useState<LocalPreference>({
    scores: null,
    recommendedAt: null,
    overallConfidence: null,
  });

  useEffect(() => {
    setMounted(true);
    const lastGood = loadLastKnownGoodSubmission();
    const fromLastGood = lastGood?.userTraitScores;
    if (fromLastGood && Object.keys(fromLastGood).length > 0) {
      setLocalPreference({
        scores: fromLastGood,
        recommendedAt: lastGood?.completedAtIso ?? null,
        overallConfidence:
          typeof lastGood?.overallConfidence === "number" ? lastGood.overallConfidence : null,
      });
      return;
    }
    setLocalPreference({
      scores: null,
      recommendedAt: lastGood?.completedAtIso ?? null,
      overallConfidence:
        typeof lastGood?.overallConfidence === "number" ? lastGood.overallConfidence : null,
    });
  }, []);

  const fromSavedScores = latestSaved ? readTraitScoresFromMetadata(latestSaved.metadata) : null;
  const scores = localPreference.scores ?? fromSavedScores;
  const recommendedAt =
    localPreference.recommendedAt ??
    (typeof latestSaved?.metadata?.recommendedAt === "string"
      ? latestSaved.metadata.recommendedAt
      : latestSaved?.saved_at ?? null);

  const traitRows = scores ? fixedAxisSummaryRows(scores) : [];
  const relative = mounted ? formatRelativeKo(recommendedAt ?? undefined) : null;
  const stackParts = latestSaved ? buildStackParts(latestSaved) : [];
  const switchPart = stackParts.find((part) => part.key === "switches" || part.key === "switch");
  const secondaryPart = stackParts.find((part) => part.key === "plate") ?? stackParts.find((part) => part.key === "layout");
  const hasRecommendationHint = Boolean(recommendedAt) || Boolean(scores);
  const completedSurveyCount = hasRecommendationHint ? 1 : 0;
  const bestMatch = bestMatchPercent(savedItems, localPreference.overallConfidence);
  const [titleLine1, titleLine2] = latestSaved ? shortSavedTitleLines(latestSaved) : ["", undefined];
  const latestTags = latestSaved ? savedPreferenceTags(latestSaved) : [];
  const latestMatch = latestSaved ? savedMatchPercent(latestSaved) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="저장한 조합" value={savedItems.length} />
        <StatCard label="완료한 설문" value={completedSurveyCount} />
        <div className="col-span-2 sm:col-span-1">
          <StatCard label="최고 일치도" value={bestMatch !== null ? `${bestMatch}%` : "—"} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border-2 border-[rgb(220_220_238)] bg-white dark:border-border dark:bg-ca-surface-container">
        <div className="flex items-center justify-between border-b border-[rgb(220_220_238)] bg-[rgb(248_248_252)] px-5 py-3 dark:border-border dark:bg-ca-surface-container-low">
          <p className="text-xs font-bold uppercase tracking-widest text-[rgb(100_100_120)] dark:text-ca-on-surface-variant">
            취향 프로필
          </p>
          <Link
            href="/recommend"
            prefetch={false}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            설문 다시하기 <ChevronRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
        {traitRows.length ? (
          <div className="divide-y divide-[rgb(220_220_238)] dark:divide-border">
            {traitRows.map((row) => (
              <div key={row.id} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm font-semibold text-[rgb(60_60_80)] dark:text-ca-on-surface">{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ca-on-surface">{row.value}</span>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-4">
            <div className="rounded-lg border border-dashed border-ca-outline-variant/50 p-4 text-sm text-ca-on-surface-variant">
              설문으로 취향을 만들면 여기에 6축 요약이 표시됩니다.
              <Link
                href="/recommend"
                prefetch={false}
                className={buttonClassName({ variant: "primary", size: "sm", className: "mt-3" })}
              >
                설문으로 취향 만들기
              </Link>
            </div>
          </div>
        )}
      </div>

      {latestSaved ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-[rgb(60_60_80)] dark:text-ca-on-surface">최근 저장한 조합</p>
            <Link
              href="/mypage?section=saved"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              전체 보기 <ChevronRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
          <div className="rounded-xl border-2 border-[rgb(220_220_238)] bg-white p-5 transition-colors hover:border-primary/40 dark:border-border dark:bg-ca-surface-container">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-headline font-extrabold text-ca-on-surface">
                  {titleLine1}
                  {titleLine2 ? ` ${titleLine2}` : null}
                </h3>
                {latestTags.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {latestTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-primary/15 bg-[rgb(238_235_255)] px-2.5 py-0.5 text-[11px] font-semibold text-primary dark:bg-primary/15"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-3 space-y-1 text-xs text-ca-on-surface-variant">
                  {switchPart ? <p>· 스위치 {switchPart.name}</p> : null}
                  {secondaryPart ? (
                    <p>
                      · {secondaryPart.label} {secondaryPart.name}
                    </p>
                  ) : null}
                </div>
              </div>
              {latestMatch !== null ? (
                <p className="shrink-0 font-headline text-lg font-extrabold tabular-nums text-primary">{latestMatch}%</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-[rgb(220_220_238)] bg-white p-8 text-center dark:border-border dark:bg-ca-surface-container">
          <p className="text-sm font-medium text-ca-on-surface-variant">
            {hasRecommendationHint
              ? relative
                ? `이 브라우저에 ${relative} 설문 결과가 있습니다. 계정 저장 목록에는 아직 없습니다.`
                : "이 브라우저에 설문 결과가 있습니다. 계정 저장 목록에는 아직 없습니다."
              : "아직 저장한 결과가 없습니다. 결과에서 「이 결과 저장」을 누르면 여기에 모입니다."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {hasRecommendationHint ? (
              <Link
                href="/results"
                prefetch={false}
                className={buttonClassName({ variant: "outline", size: "sm" })}
              >
                최근 추천 결과 열기
              </Link>
            ) : null}
            <Link href="/recommend" prefetch={false} className={buttonClassName({ size: "sm" })}>
              설문 시작하기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
