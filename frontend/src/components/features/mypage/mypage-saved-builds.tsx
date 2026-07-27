"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { buildStackParts, savedItemKey } from "@/components/features/mypage/mypage-build-stack";
import {
  savedLayoutName,
  savedOneLineSummary,
  savedPreferenceTags,
  savedSwitchName,
  shortSavedTitle,
  shortSavedTitleLines,
} from "@/components/features/mypage/mypage-saved-identity";
import { MyPageSectionCard } from "@/components/features/mypage/mypage-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SavedRecommendationItem } from "@/lib/api/saved-recommendations";
import {
  loadResultSnapshot,
  makeResultSnapshotId,
} from "@/lib/saved-result-snapshots";
import { formatAbsoluteDate, formatAbsoluteDateTime, toEpochMs } from "@/lib/date-time";
import { loadLastKnownGoodSubmission, saveSurveySubmission } from "@/lib/survey-storage";
import { cn } from "@/lib/utils";

type Props = {
  items: SavedRecommendationItem[];
  removingKeys: Set<string>;
  onRemove: (item: SavedRecommendationItem) => Promise<void>;
};

/** Show search only once the list is long enough to need it. */
const SEARCH_VISIBLE_FROM = 16;

function getUpdatedAt(item: SavedRecommendationItem): number {
  const raw = item.metadata?.updatedAt;
  if (typeof raw === "string") {
    const parsed = toEpochMs(raw);
    if (parsed > 0) return parsed;
  }
  return toEpochMs(item.saved_at);
}

function normalizeText(item: SavedRecommendationItem): string {
  return [item.title, item.summary, item.build_id, ...Object.values(item.components ?? {})]
    .join(" ")
    .toLowerCase();
}

function snapshotIdFor(item: SavedRecommendationItem): string {
  if (typeof item.metadata?.resultSnapshotId === "string" && item.metadata.resultSnapshotId.trim()) {
    return item.metadata.resultSnapshotId;
  }
  return makeResultSnapshotId(item.request_id, item.build_id);
}

function canRestoreResults(item: SavedRecommendationItem): boolean {
  if (loadResultSnapshot(snapshotIdFor(item))) return true;
  const lastGood = loadLastKnownGoodSubmission();
  if (!lastGood?.build) return false;
  return lastGood.build.id === item.build_id;
}

function restoreSubmissionFor(item: SavedRecommendationItem) {
  const fromSnapshot = loadResultSnapshot(snapshotIdFor(item));
  if (fromSnapshot) return fromSnapshot;
  const lastGood = loadLastKnownGoodSubmission();
  if (lastGood?.build?.id === item.build_id) return lastGood;
  return null;
}

function ListIdentityMeta({ item }: { item: SavedRecommendationItem }) {
  const tags = savedPreferenceTags(item);
  const switchName = savedSwitchName(item);
  const layoutName = savedLayoutName(item);
  return (
    <div className="mt-1 space-y-0.5">
      {tags.length ? (
        <p className="truncate text-xs text-ca-on-surface-variant">{tags.join(" · ")}</p>
      ) : null}
      {switchName || layoutName ? (
        <p className="truncate text-xs text-ca-on-surface-variant">
          {[switchName ? `스위치 ${switchName}` : null, layoutName ? `배열 ${layoutName}` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

export function MyPageSavedBuilds({ items, removingKeys, onRemove }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SavedRecommendationItem | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hasLocalResult, setHasLocalResult] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasLocalResult(Boolean(loadLastKnownGoodSubmission()?.build));
    if (typeof window.matchMedia === "function" && window.matchMedia("(min-width: 1024px)").matches) {
      setMobileDetailOpen(true);
    }
  }, []);

  const showSearch = items.length >= SEARCH_VISIBLE_FROM;
  const activeQuery = showSearch ? query : "";

  const filtered = useMemo(() => {
    const q = activeQuery.trim().toLowerCase();
    const matched = q
      ? items.filter((item) => normalizeText(item).includes(q) || shortSavedTitle(item).toLowerCase().includes(q))
      : [...items];
    matched.sort((a, b) => toEpochMs(b.saved_at) - toEpochMs(a.saved_at));
    return matched;
  }, [activeQuery, items]);

  useEffect(() => {
    if (!showSearch && query) setQuery("");
  }, [query, showSearch]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedKey(null);
      setMobileDetailOpen(false);
      return;
    }
    if (!selectedKey || !filtered.some((item) => savedItemKey(item) === selectedKey)) {
      setSelectedKey(savedItemKey(filtered[0]));
    }
  }, [filtered, selectedKey]);

  const selected = useMemo(
    () => filtered.find((item) => savedItemKey(item) === selectedKey) ?? null,
    [filtered, selectedKey],
  );

  const stackParts = selected ? buildStackParts(selected) : [];
  const selectedKeySafe = selected ? savedItemKey(selected) : null;
  const isRemoving = selectedKeySafe ? removingKeys.has(selectedKeySafe) : false;
  const canRestore = mounted && selected ? canRestoreResults(selected) : false;
  const selectedTags = selected ? savedPreferenceTags(selected) : [];
  const selectedSummary = selected ? savedOneLineSummary(selected) : null;
  const selectedSwitch = selected ? savedSwitchName(selected) : null;

  return (
    <MyPageSectionCard
      title="저장한 결과"
      description={
        items.length
          ? "목록에서 결과를 고르면 상세와 다시 보기·삭제 행동을 확인할 수 있습니다."
          : "결과 화면에서 저장하면 이 목록에 쌓입니다."
      }
    >
      {showSearch ? (
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목·스위치 등으로 검색"
          aria-label="저장한 결과 검색"
        />
      ) : null}

      {restoreError ? (
        <div className="rounded-lg border border-ca-outline-variant/50 bg-ca-surface-container/40 px-4 py-3 text-sm text-ca-on-surface-variant">
          {restoreError}
          <button
            type="button"
            className="ml-3 text-sm font-medium text-ca-primary hover:underline"
            onClick={() => setRestoreError(null)}
          >
            닫기
          </button>
        </div>
      ) : null}

      {filtered.length && selected ? (
        <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)] lg:min-h-[28rem]">
          <div
            className={cn(
              "flex max-h-[22rem] flex-col overflow-hidden rounded-xl border border-border bg-white/80 dark:bg-ca-surface-container/40 p-2 sm:p-2.5 lg:max-h-none lg:h-full",
              mobileDetailOpen && "hidden lg:flex",
            )}
            role="listbox"
            aria-label="저장한 결과 목록"
          >
            <div className="mypage-pane-scroll min-h-0 flex-1 space-y-2 overscroll-contain pr-0.5">
              {filtered.map((item) => {
                const key = savedItemKey(item);
                const active = key === selectedKey;
                const [line1, line2] = shortSavedTitleLines(item);
                return (
                  <button
                    key={key}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setSelectedKey(key);
                      setMobileDetailOpen(true);
                      setRestoreError(null);
                    }}
                    className={cn(
                      "flex min-h-[5.5rem] w-full flex-col justify-between rounded-lg border px-3 py-2.5 text-left transition-colors",
                      active
                        ? "border-ca-on-surface/40 bg-ca-surface-container/60"
                        : "border-ca-outline-variant/40 bg-transparent hover:border-ca-outline-variant/70 hover:bg-ca-surface-container/40",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-headline text-sm font-semibold leading-snug text-ca-on-surface">{line1}</p>
                      {line2 ? (
                        <p className="truncate font-headline text-sm font-semibold leading-snug text-ca-on-surface">
                          {line2}
                        </p>
                      ) : null}
                      <ListIdentityMeta item={item} />
                    </div>
                    <p className="mt-1.5 text-xs text-ca-on-surface-variant">{formatAbsoluteDate(item.saved_at)} 저장</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={cn(
              "flex h-full min-h-[22rem] flex-col rounded-xl border border-border bg-white/80 dark:bg-ca-surface-container/40 p-4 sm:p-5 lg:min-h-0",
              !mobileDetailOpen && "hidden lg:flex",
            )}
          >
            <div className="mb-3 lg:hidden">
              <Button type="button" variant="ghost" size="sm" onClick={() => setMobileDetailOpen(false)}>
                ← 목록으로
              </Button>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ca-outline-variant/30 pb-4">
              <div className="min-w-0 space-y-1.5">
                <p className="font-headline text-lg font-semibold tracking-tight text-ca-on-surface">
                  {shortSavedTitle(selected)}
                </p>
                {selectedTags.length ? (
                  <p className="text-sm text-ca-on-surface-variant">{selectedTags.join(" · ")}</p>
                ) : null}
                {selectedSwitch ? (
                  <p className="text-sm text-ca-on-surface-variant">대표 스위치 · {selectedSwitch}</p>
                ) : null}
                <p className="text-sm text-ca-on-surface-variant">
                  저장: {formatAbsoluteDateTime(selected.saved_at)}
                  {getUpdatedAt(selected) !== toEpochMs(selected.saved_at)
                    ? ` · 수정: ${formatAbsoluteDateTime(getUpdatedAt(selected))}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                disabled={!canRestore}
                title={
                  canRestore
                    ? undefined
                    : "같은 브라우저에서 저장한 결과만 결과 화면으로 다시 열 수 있습니다."
                }
                onClick={() => {
                  const submission = restoreSubmissionFor(selected);
                  if (!submission) {
                    setRestoreError(
                      "이 항목에서는 추천 결과를 다시 열 수 없습니다. 같은 브라우저에서 저장한 결과만 복원할 수 있어요. 대신 설문을 다시 하거나 구성 상세를 확인해 주세요.",
                    );
                    return;
                  }
                  saveSurveySubmission(submission);
                  router.push("/results");
                }}
              >
                추천 결과 다시 보기
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => router.push("/recommend")}>
                다시 설문
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isRemoving}
                onClick={() => setPendingDelete(selected)}
              >
                {isRemoving ? "삭제 중…" : "삭제"}
              </Button>
            </div>
            {!canRestore ? (
              <p className="mt-2 break-keep text-xs leading-relaxed text-ca-on-surface-variant">
                결과 다시 보기는 이 브라우저에 다시 열 데이터가 있을 때만 가능합니다. 구성 확인·다시 설문은 계속
                사용할 수 있어요.
              </p>
            ) : null}

            <div className="mypage-pane-scroll min-h-0 flex-1 overscroll-contain">
              {stackParts.length ? (
                <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2">
                  {stackParts.map((part, index) => {
                    const isLeft = index % 2 === 0;
                    const row = Math.floor(index / 2);
                    const lastRow = Math.floor((stackParts.length - 1) / 2);
                    const isLastOdd = stackParts.length % 2 === 1 && index === stackParts.length - 1;
                    return (
                      <li
                        key={part.key}
                        className={cn(
                          "py-3",
                          row < lastRow && "border-b border-ca-outline-variant/25",
                          isLeft && !isLastOdd && "sm:border-r sm:border-ca-outline-variant/25 sm:pr-4",
                          !isLeft && "sm:pl-4",
                          isLastOdd && "sm:col-span-2",
                        )}
                      >
                        <p className="text-sm font-medium text-ca-on-surface-variant">{part.label}</p>
                        <p className="mt-0.5 text-sm font-medium text-ca-on-surface">{part.name}</p>
                        {part.detail ? (
                          <p className="mt-1 line-clamp-2 break-keep text-sm leading-relaxed text-ca-on-surface-variant">
                            {part.detail}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-ca-on-surface-variant">
                  {selectedSummary || "부품 구성 정보가 아직 없습니다."}
                </p>
              )}

              {selectedSummary && stackParts.length ? (
                <p className="mt-4 border-t border-ca-outline-variant/25 pt-4 break-keep text-sm leading-relaxed text-ca-on-surface-variant">
                  {selectedSummary}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-ca-outline-variant/50 p-5 text-sm text-ca-on-surface-variant">
          {items.length ? (
            showSearch && activeQuery.trim() ? (
              <>
                <p>검색 결과가 없습니다.</p>
                <Button type="button" variant="outline" size="sm" onClick={() => setQuery("")}>
                  검색 지우기
                </Button>
              </>
            ) : (
              <p>조건에 맞는 저장한 결과가 없습니다.</p>
            )
          ) : (
            <>
              <p className="font-headline text-base font-semibold text-ca-on-surface">아직 저장한 추천이 없어요.</p>
              <p className="break-keep leading-relaxed">
                설문 결과에서 마음에 드는 조합을 저장하면 여기서 다시 볼 수 있습니다.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button type="button" variant="primary" size="sm" onClick={() => router.push("/recommend")}>
                  추천 설문 시작
                </Button>
                {mounted && hasLocalResult ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const last = loadLastKnownGoodSubmission();
                      if (last) {
                        saveSurveySubmission(last);
                        router.push("/results");
                      }
                    }}
                  >
                    최근 추천 결과로 돌아가기
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </div>
      )}

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ca-base/70 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mypage-delete-title"
            className="w-full max-w-md rounded-xl border border-border bg-white dark:bg-ca-surface-container p-5 shadow-lg"
          >
            <p id="mypage-delete-title" className="font-headline text-base font-semibold text-ca-on-surface">
              저장한 결과를 삭제할까요?
            </p>
            <p className="mt-2 break-keep text-sm leading-relaxed text-ca-on-surface-variant">
              &quot;{shortSavedTitle(pendingDelete)}&quot; 항목을 삭제하면 되돌릴 수 없습니다.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPendingDelete(null)}>
                취소
              </Button>
              <Button
                variant="destructive"
                disabled={removingKeys.has(savedItemKey(pendingDelete))}
                onClick={() => {
                  const target = pendingDelete;
                  setPendingDelete(null);
                  void onRemove(target);
                }}
              >
                삭제하기
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </MyPageSectionCard>
  );
}
