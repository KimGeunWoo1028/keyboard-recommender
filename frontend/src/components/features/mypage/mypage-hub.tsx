"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MyPageAccount } from "@/components/features/mypage/mypage-account";
import { MyPageOverview } from "@/components/features/mypage/mypage-overview";
import { MyPageSavedBuilds } from "@/components/features/mypage/mypage-saved-builds";
import { useAuthHeader } from "@/components/layout/auth-controls";
import { Button, buttonClassName } from "@/components/ui/button";
import { fetchAccountSecuritySummary, type AccountSecuritySummary } from "@/lib/api/auth";
import {
  listSavedBookmarksWithLocalFallback,
  mergeSavedBookmarkLists,
  removeSavedRecommendationBookmark,
  subscribeSavedBookmarksChanged,
  type SavedRecommendationItem,
} from "@/lib/api/saved-recommendations";
import { makeResultSnapshotId, removeResultSnapshot } from "@/lib/saved-result-snapshots";

type SectionId = "overview" | "saved" | "account";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "overview", label: "개요" },
  { id: "saved", label: "저장한 빌드" },
  { id: "account", label: "계정" },
];

const SECTION_IDS = new Set<SectionId>(SECTIONS.map((s) => s.id));

function parseSection(raw: string | null): SectionId | null {
  if (!raw) return null;
  if (raw === "activity") return "saved";
  return SECTION_IDS.has(raw as SectionId) ? (raw as SectionId) : null;
}

function savedItemKey(item: SavedRecommendationItem): string {
  return `${item.request_id}:${item.build_id}:${item.saved_at}`;
}

export function MyPageHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useAuthHeader();
  const sectionFromUrl = parseSection(searchParams.get("section"));
  const [active, setActive] = useState<SectionId>(sectionFromUrl ?? "overview");
  const [extrasLoading, setExtrasLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<SavedRecommendationItem[]>([]);
  const [securitySummary, setSecuritySummary] = useState<AccountSecuritySummary | null>(null);
  const [removingKeys, setRemovingKeys] = useState<Set<string>>(new Set());

  const mapLoadErrorMessage = useCallback((error: unknown): string => {
    if (error instanceof Error) {
      if (/failed to fetch|networkerror|network request failed|load failed/i.test(error.message)) {
        return "저장한 빌드를 불러오지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
      }
      if (/[가-힣]/.test(error.message)) return error.message;
    }
    return "마이페이지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }, []);

  const loadExtras = useCallback(async () => {
    setExtrasLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      // Saved builds are the critical path — do not fail the whole hub if
      // security-summary is slow/unreachable (common on local SQLite stacks).
      const saved = await listSavedBookmarksWithLocalFallback({ limit: 100 });
      setSavedItems(saved);
      try {
        setSecuritySummary(await fetchAccountSecuritySummary());
      } catch {
        setSecuritySummary(null);
      }
    } catch (e) {
      setLoadError(mapLoadErrorMessage(e));
    } finally {
      setExtrasLoading(false);
    }
  }, [mapLoadErrorMessage]);

  useEffect(() => {
    if (!user?.id) return;
    void loadExtras();
  }, [loadExtras, user?.id]);

  useEffect(() => {
    return subscribeSavedBookmarksChanged((detail) => {
      if (detail.type === "upsert") {
        setSavedItems((prev) => mergeSavedBookmarkLists([detail.item], prev));
        return;
      }
      setSavedItems((prev) =>
        prev.filter((item) => item.build_id.trim().toLowerCase() !== detail.build_id.trim().toLowerCase()),
      );
    });
  }, []);

  useEffect(() => {
    if (sectionFromUrl) setActive(sectionFromUrl);
  }, [sectionFromUrl]);

  useEffect(() => {
    if (searchParams.get("section") === "activity") {
      router.replace("/mypage?section=saved", { scroll: false });
    }
  }, [router, searchParams]);

  const selectSection = useCallback(
    (id: SectionId) => {
      setActive(id);
      const params = new URLSearchParams(searchParams.toString());
      if (id === "overview") params.delete("section");
      else params.set("section", id);
      const qs = params.toString();
      router.replace(qs ? `/mypage?${qs}` : "/mypage", { scroll: false });
    },
    [router, searchParams],
  );

  const section = useMemo(() => {
    if (!user) {
      return (
        <div className="rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest p-5 sm:p-6">
          <h2 className="font-headline text-lg font-semibold text-ca-on-surface">로그인이 필요합니다.</h2>
          <p className="mt-1 break-keep text-sm leading-relaxed text-ca-on-surface-variant">
            세션이 만료된 경우 다시 로그인해 주세요.
          </p>
          <Link
            href="/auth?force=1"
            className={buttonClassName({ variant: "outline", className: "mt-4" })}
          >
            로그인
          </Link>
        </div>
      );
    }
    if (active === "overview") {
      return <MyPageOverview user={user} savedItems={savedItems} />;
    }
    if (active === "saved") {
      if (extrasLoading && !loadError) {
        return (
          <div
            className="min-h-[22rem] space-y-3"
            aria-busy="true"
            aria-live="polite"
            data-testid="e2e-mypage-saved-loading"
          >
            <div className="h-10 w-48 animate-pulse rounded-lg bg-ca-surface-container/60" />
            <div className="h-40 animate-pulse rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container/40" />
            <div className="h-40 animate-pulse rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container/40" />
          </div>
        );
      }
      return (
        <MyPageSavedBuilds
          items={savedItems}
          removingKeys={removingKeys}
          onRemove={async (item) => {
            const key = savedItemKey(item);
            setRemovingKeys((prev) => new Set(prev).add(key));
            setSavedItems((prev) => prev.filter((it) => savedItemKey(it) !== key));
            const snapshotId =
              typeof item.metadata?.resultSnapshotId === "string"
                ? item.metadata.resultSnapshotId
                : makeResultSnapshotId(item.request_id, item.build_id);
            removeResultSnapshot(snapshotId);
            try {
              const removed = await removeSavedRecommendationBookmark({
                request_id: item.request_id,
                build_id: item.build_id,
                saved_at: item.saved_at,
              });
              if (!removed) {
                setSavedItems((prev) => {
                  if (prev.some((it) => savedItemKey(it) === key)) return prev;
                  return mergeSavedBookmarkLists(prev, [item]);
                });
                setActionError("저장 항목을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
              }
            } catch (e) {
              setSavedItems((prev) => {
                if (prev.some((it) => savedItemKey(it) === key)) return prev;
                return mergeSavedBookmarkLists(prev, [item]);
              });
              setActionError(e instanceof Error ? e.message : "저장 항목을 삭제하지 못했습니다.");
            } finally {
              setRemovingKeys((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
              });
            }
          }}
        />
      );
    }
    return <MyPageAccount user={user} securitySummary={securitySummary} onUserChanged={setUser} />;
  }, [active, extrasLoading, loadError, removingKeys, savedItems, securitySummary, setUser, user]);

  return (
    <div className="space-y-6" data-testid="e2e-mypage-hub">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="마이페이지 섹션">
        {SECTIONS.map((tab) => (
          <Button
            key={tab.id}
            variant={tab.id === active ? "primary" : "outline"}
            size="default"
            className={
              tab.id === active
                ? "h-10 rounded-lg px-4 sm:px-5"
                : "h-10 rounded-lg border-ca-outline-variant/50 bg-transparent px-4 text-ca-on-surface-variant hover:border-ca-on-surface/30 hover:bg-ca-surface-container/50 hover:text-ca-on-surface sm:px-5"
            }
            onClick={() => selectSection(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {loadError ? (
        <div className="rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest p-5 sm:p-6">
          <h2 className="font-headline text-lg font-semibold text-ca-on-surface">데이터를 불러오지 못했습니다.</h2>
          <p className="mt-1 break-keep text-sm leading-relaxed text-ca-on-surface-variant">{loadError}</p>
          <Button variant="outline" className="mt-4" onClick={() => void loadExtras()}>
            다시 시도
          </Button>
        </div>
      ) : null}
      {!loadError && actionError ? (
        <div className="rounded-lg border border-ca-outline-variant/50 bg-ca-surface-container/40 px-4 py-3 text-sm text-ca-on-surface-variant">
          {actionError}
          <button
            type="button"
            className="ml-3 text-sm font-medium text-ca-primary hover:underline"
            onClick={() => setActionError(null)}
          >
            닫기
          </button>
        </div>
      ) : null}
      {!loadError ? section : null}
    </div>
  );
}
