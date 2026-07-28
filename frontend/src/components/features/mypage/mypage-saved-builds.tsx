"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { savedItemKey } from "@/components/features/mypage/mypage-build-stack";
import {
  savedMatchPercent,
  savedPartsOneLiner,
  savedPreferenceTags,
  shortSavedTitle,
} from "@/components/features/mypage/mypage-saved-identity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SavedRecommendationItem } from "@/lib/api/saved-recommendations";
import { emitExplorationEvent } from "@/lib/api/saved-recommendations";
import {
  loadResultSnapshot,
  makeResultSnapshotId,
  saveResultSnapshot,
  submissionFromSavedMetadata,
} from "@/lib/saved-result-snapshots";
import { formatAbsoluteDate, toEpochMs } from "@/lib/date-time";
import { getOrCreateClientSessionId } from "@/lib/client-session-id";
import { loadLastKnownGoodSubmission, saveSurveySubmission } from "@/lib/survey-storage";
import { cn } from "@/lib/utils";

type Props = {
  items: SavedRecommendationItem[];
  removingKeys: Set<string>;
  onRemove: (item: SavedRecommendationItem) => Promise<void>;
};

/** Show search only once the list is long enough to need it. */
const SEARCH_VISIBLE_FROM = 16;

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
  if (submissionFromSavedMetadata(item.metadata)) return true;
  if (loadResultSnapshot(snapshotIdFor(item))) return true;
  const lastGood = loadLastKnownGoodSubmission();
  if (!lastGood?.build) return false;
  return lastGood.build.id === item.build_id;
}

function restoreSubmissionFor(item: SavedRecommendationItem) {
  const fromServer = submissionFromSavedMetadata(item.metadata);
  if (fromServer) return fromServer;
  const fromSnapshot = loadResultSnapshot(snapshotIdFor(item));
  if (fromSnapshot) return fromSnapshot;
  const lastGood = loadLastKnownGoodSubmission();
  if (lastGood?.build?.id === item.build_id) return lastGood;
  return null;
}

function restoreSavedResult(item: SavedRecommendationItem): boolean {
  const submission = restoreSubmissionFor(item);
  if (!submission) return false;
  saveResultSnapshot(snapshotIdFor(item), submission);
  saveSurveySubmission(submission);
  void emitExplorationEvent({
    event_type: "interaction.revisit",
    request_id: item.request_id,
    session_id: getOrCreateClientSessionId(),
    scenario_id: "mypage_restore_v1",
    metadata: {
      buildId: item.build_id,
      source: submissionFromSavedMetadata(item.metadata) ? "server_snapshot" : "local_snapshot",
      resultSnapshotId: snapshotIdFor(item),
    },
  }).catch(() => undefined);
  return true;
}

export function MyPageSavedBuilds({ items, removingKeys, onRemove }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<SavedRecommendationItem | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hasLocalResult, setHasLocalResult] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHasLocalResult(Boolean(loadLastKnownGoodSubmission()?.build));
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

  return (
    <div className="space-y-4">
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

      {filtered.length ? (
        <ul className="space-y-3" aria-label="저장한 결과 목록">
          {filtered.map((item) => {
            const key = savedItemKey(item);
            const tags = savedPreferenceTags(item);
            const partsLine = savedPartsOneLiner(item);
            const matchPercent = savedMatchPercent(item);
            const canRestore = mounted && canRestoreResults(item);
            const isRemoving = removingKeys.has(key);

            return (
              <li
                key={key}
                className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:bg-ca-surface-container"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {matchPercent !== null ? (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                          일치도 {matchPercent}%
                        </span>
                      ) : null}
                      <span className="text-xs text-ca-on-surface-variant" data-testid="e2e-saved-card-date">
                        {formatAbsoluteDate(item.saved_at)}
                      </span>
                    </div>

                    <h3 className="font-headline text-lg font-bold tracking-tight text-ca-on-surface">
                      {shortSavedTitle(item)}
                    </h3>

                    {tags.length ? (
                      <ul className="flex flex-wrap gap-1.5" aria-label="취향 태그">
                        {tags.map((tag) => (
                          <li
                            key={`${key}-${tag}`}
                            className="rounded-full border border-border bg-[#F8F9FA] px-2.5 py-0.5 text-xs font-medium text-ca-on-surface-variant dark:bg-ca-surface-container-low"
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {partsLine ? (
                      <p className="truncate text-sm text-ca-on-surface-variant">{partsLine}</p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                    <button
                      type="button"
                      className={cn(
                        "text-sm font-semibold underline-offset-4",
                        canRestore
                          ? "text-primary hover:underline"
                          : "cursor-not-allowed text-ca-on-surface-variant/50",
                      )}
                      disabled={!canRestore}
                      title={
                        canRestore
                          ? undefined
                          : "이 저장본에는 다시 열 결과 데이터가 없습니다. 결과 화면에서 다시 저장하면 복원할 수 있습니다."
                      }
                      onClick={() => {
                        setRestoreError(null);
                        if (!restoreSavedResult(item)) {
                          setRestoreError(
                            "이 항목에는 다시 열 결과 데이터가 없습니다. 결과 화면에서 한 번 더 저장하면 다른 기기에서도 다시 볼 수 있어요.",
                          );
                          return;
                        }
                        router.push("/results");
                      }}
                    >
                      결과 보기
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={isRemoving}
                      onClick={() => setPendingDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      {isRemoving ? "삭제 중…" : "삭제"}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="space-y-3 rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-ca-on-surface-variant dark:bg-ca-surface-container">
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
              <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap">
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
            className="w-full max-w-md rounded-xl border border-border bg-white p-5 shadow-lg dark:bg-ca-surface-container"
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
    </div>
  );
}
