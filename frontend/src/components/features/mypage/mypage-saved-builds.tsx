"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { buildStackParts, savedItemKey } from "@/components/features/mypage/mypage-build-stack";
import { MyPageSectionCard } from "@/components/features/mypage/mypage-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SavedRecommendationItem } from "@/lib/api/saved-recommendations";
import {
  loadResultSnapshot,
  makeResultSnapshotId,
} from "@/lib/saved-result-snapshots";
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
    const parsed = +new Date(raw);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return +new Date(item.saved_at);
}

function normalizeText(item: SavedRecommendationItem): string {
  return [item.title, item.summary, item.build_id, ...Object.values(item.components ?? {})]
    .join(" ")
    .toLowerCase();
}

/** List-row title: drop "추천 조합:" prefix and English parentheticals like (Thocky). */
function shortTitle(item: SavedRecommendationItem): string {
  let title = (item.title || item.build_id).trim();
  title = title.replace(/^추천\s*조합\s*:\s*/i, "");
  title = title.replace(/\s*\([^)]*\)/g, "");
  title = title.replace(/\s{2,}/g, " ").replace(/\s·\s/g, " · ").trim();
  return title || item.build_id;
}

/** Split short title on "·" into up to two display lines. */
function shortTitleLines(item: SavedRecommendationItem): [string, string?] {
  const title = shortTitle(item);
  const parts = title
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts.slice(1).join(" · ")];
  return [title];
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

export function MyPageSavedBuilds({ items, removingKeys, onRemove }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavedRecommendationItem | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showSearch = items.length >= SEARCH_VISIBLE_FROM;
  const activeQuery = showSearch ? query : "";

  const filtered = useMemo(() => {
    const q = activeQuery.trim().toLowerCase();
    const matched = q
      ? items.filter((item) => normalizeText(item).includes(q) || shortTitle(item).toLowerCase().includes(q))
      : [...items];
    matched.sort((a, b) => +new Date(b.saved_at) - +new Date(a.saved_at));
    return matched;
  }, [activeQuery, items]);

  useEffect(() => {
    if (!showSearch && query) setQuery("");
  }, [query, showSearch]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedKey(null);
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

  return (
    <MyPageSectionCard eyebrow="SAVED" title="저장한 빌드" description="왼쪽에서 빌드를 고르면 오른쪽에 상세가 표시됩니다.">
      {showSearch ? (
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목·스위치 등으로 검색"
          aria-label="저장한 빌드 검색"
        />
      ) : null}

      {restoreError ? (
        <div className="rounded-lg border border-ca-outline-variant/50 bg-ca-surface-container/40 px-4 py-3 text-sm text-ca-on-surface-variant">
          {restoreError}
          <button
            type="button"
            className="ml-3 font-label text-ca-label-sm font-medium text-ca-primary hover:underline"
            onClick={() => setRestoreError(null)}
          >
            닫기
          </button>
        </div>
      ) : null}

      {filtered.length && selected ? (
        <div className="grid items-stretch gap-3 lg:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)] lg:min-h-[28rem]">
          <div
            className="ca-glass-panel flex max-h-[22rem] flex-col overflow-hidden border-ca-outline-variant/40 p-2 sm:p-2.5 lg:max-h-none lg:h-full"
            role="listbox"
            aria-label="저장한 빌드 목록"
          >
            <div className="mypage-pane-scroll min-h-0 flex-1 space-y-2 overscroll-contain pr-0.5">
              {filtered.map((item) => {
                const key = savedItemKey(item);
                const active = key === selectedKey;
                const [line1, line2] = shortTitleLines(item);
                return (
                  <button
                    key={key}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setSelectedKey(key);
                      setRestoreError(null);
                    }}
                    className={cn(
                      "flex h-[4.75rem] w-full flex-col justify-between rounded-lg border px-3 py-2.5 text-left transition",
                      active
                        ? "border-ca-primary/50 bg-ca-primary/10 shadow-[0_0_0_1px_rgba(124,58,237,0.25)]"
                        : "border-ca-outline-variant/40 bg-ca-surface-container/30 hover:border-ca-primary/35 hover:bg-ca-surface-container/50",
                    )}
                  >
                    <div className="min-h-[2.5rem]">
                      <p className="truncate font-headline text-sm font-semibold leading-snug text-ca-on-surface">{line1}</p>
                      <p className="truncate font-headline text-sm font-semibold leading-snug text-ca-on-surface">
                        {line2 ?? "\u00A0"}
                      </p>
                    </div>
                    <p className="font-label text-[11px] text-ca-on-surface-variant">
                      {new Date(item.saved_at).toLocaleDateString()}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ca-glass-panel flex h-full min-h-[22rem] flex-col border-ca-outline-variant/40 p-4 sm:p-5 lg:min-h-0">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ca-outline-variant/30 pb-4">
              <div className="min-w-0 space-y-1">
                <p className="font-headline text-lg font-semibold text-ca-on-surface">{selected.title || selected.build_id}</p>
                <p className="font-label text-[11px] text-ca-on-surface-variant">
                  저장: {new Date(selected.saved_at).toLocaleString()}
                  {getUpdatedAt(selected) !== +new Date(selected.saved_at)
                    ? ` · 수정: ${new Date(getUpdatedAt(selected)).toLocaleString()}`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!canRestore}
                  title={
                    canRestore
                      ? undefined
                      : "이 저장본에서는 결과 복원이 어렵습니다. 같은 브라우저에서 저장한 빌드만 가능합니다."
                  }
                  onClick={() => {
                    const submission = restoreSubmissionFor(selected);
                    if (!submission) {
                      setRestoreError(
                        "이 저장본에서는 추천 결과를 다시 열 수 없습니다. 같은 브라우저에서 저장한 빌드만 복원할 수 있어요.",
                      );
                      return;
                    }
                    saveSurveySubmission(submission);
                    router.push("/results");
                  }}
                >
                  추천 결과 다시 보기
                </Button>
                <Button variant="ghost" size="sm" disabled={isRemoving} onClick={() => setPendingDelete(selected)}>
                  {isRemoving ? "삭제 중..." : "삭제"}
                </Button>
              </div>
            </div>

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
                        <p className="font-label text-ca-label-sm font-medium text-ca-secondary">{part.label}</p>
                        <p className="mt-0.5 text-sm font-medium text-ca-on-surface">{part.name}</p>
                        {part.detail ? (
                          <p className="mt-1 text-sm leading-relaxed text-ca-on-surface-variant">{part.detail}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-ca-on-surface-variant">
                  {selected.summary || "부품 구성 정보가 아직 없습니다."}
                </p>
              )}

              {selected.summary && stackParts.length ? (
                <p className="mt-4 border-t border-ca-outline-variant/25 pt-4 text-sm leading-relaxed text-ca-on-surface-variant">
                  {selected.summary}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-ca-outline-variant/50 p-5 text-sm text-ca-on-surface-variant">
          {items.length
            ? showSearch && activeQuery.trim()
              ? "검색 결과가 없습니다."
              : "조건에 맞는 저장 빌드가 없습니다."
            : "아직 저장한 빌드가 없습니다. 결과 화면에서 '빌드 저장'을 눌러 보세요."}
        </div>
      )}

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ca-base/70 px-4 backdrop-blur-sm">
          <div className="ca-glass-elevated w-full max-w-md p-5">
            <p className="font-headline text-base font-semibold text-ca-on-surface">저장한 빌드를 삭제할까요?</p>
            <p className="mt-2 text-sm text-ca-on-surface-variant">
              &quot;{pendingDelete.title || pendingDelete.build_id}&quot; 항목을 삭제하면 되돌릴 수 없습니다.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPendingDelete(null)}>
                취소
              </Button>
              <Button
                variant="primary"
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
