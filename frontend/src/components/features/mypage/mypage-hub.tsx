"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MyPageAccount } from "@/components/features/mypage/mypage-account";
import { MyPageOverview } from "@/components/features/mypage/mypage-overview";
import { MyPageSavedBuilds } from "@/components/features/mypage/mypage-saved-builds";
import { Button, buttonClassName } from "@/components/ui/button";
import { fetchAccountSecuritySummary, fetchCurrentUser, type AccountSecuritySummary, type AuthUser } from "@/lib/api/auth";
import {
  listSavedBookmarksWithLocalFallback,
  mergeSavedBookmarkLists,
  removeSavedRecommendationBookmark,
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

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full animate-pulse rounded-lg bg-ca-surface-container/60 sm:w-96" />
      <div className="h-48 animate-pulse rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container/40" />
      <div className="h-48 animate-pulse rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container/40" />
    </div>
  );
}

export function MyPageHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionFromUrl = parseSection(searchParams.get("section"));
  const [active, setActive] = useState<SectionId>(sectionFromUrl ?? "overview");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [savedItems, setSavedItems] = useState<SavedRecommendationItem[]>([]);
  const [securitySummary, setSecuritySummary] = useState<AccountSecuritySummary | null>(null);
  const [removingKeys, setRemovingKeys] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      const [u, saved, security] = await Promise.all([
        fetchCurrentUser(),
        listSavedBookmarksWithLocalFallback({ limit: 100 }),
        fetchAccountSecuritySummary(),
      ]);
      setUser(u);
      setSavedItems(saved);
      setSecuritySummary(security);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "마이페이지를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
        <div className="ca-glass-panel border-ca-outline-variant/40 p-6">
          <p className="font-label text-ca-label-sm font-medium text-ca-secondary">AUTH REQUIRED</p>
          <h2 className="mt-1 font-headline text-lg font-semibold text-ca-on-surface">로그인이 필요합니다.</h2>
          <p className="mt-1 text-sm text-ca-on-surface-variant">세션이 만료된 경우 다시 로그인해 주세요.</p>
          <Link href="/auth?force=1" className={`${buttonClassName({ variant: "outline", className: "mt-4 rounded-full" })}`}>
            로그인
          </Link>
        </div>
      );
    }
    if (active === "overview") {
      return <MyPageOverview user={user} savedItems={savedItems} />;
    }
    if (active === "saved") {
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
  }, [active, removingKeys, savedItems, securitySummary, user]);

  return (
    <div className="space-y-6" data-testid="e2e-mypage-hub">
      <div className="space-y-2">
        <p className="font-label text-ca-label-sm font-medium text-ca-secondary">WORKSHOP</p>
        <h1 className="font-headline text-2xl font-bold tracking-tight text-ca-on-surface sm:text-3xl">마이페이지</h1>
        <p className="max-w-2xl text-sm text-ca-on-surface-variant">
          취향 스냅샷, 저장한 빌드, 계정 설정을 한곳에서 관리하세요.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((tab) => (
          <Button
            key={tab.id}
            variant={tab.id === active ? "primary" : "outline"}
            size="sm"
            className={
              tab.id === active
                ? "rounded-full"
                : "rounded-full border-ca-outline-variant/60 bg-transparent text-ca-on-surface-variant hover:border-ca-primary/40 hover:bg-ca-primary/10 hover:text-ca-on-surface"
            }
            onClick={() => selectSection(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {loading ? <LoadingSkeleton /> : null}
      {!loading && loadError ? (
        <div className="ca-glass-panel border-ca-outline-variant/40 p-6">
          <p className="font-label text-ca-label-sm font-medium text-ca-secondary">ERROR</p>
          <h2 className="mt-1 font-headline text-lg font-semibold text-ca-on-surface">데이터를 불러오지 못했습니다.</h2>
          <p className="mt-1 text-sm text-ca-on-surface-variant">{loadError}</p>
          <Button variant="outline" className="mt-4 rounded-full" onClick={() => void load()}>
            다시 시도
          </Button>
        </div>
      ) : null}
      {!loading && !loadError && actionError ? (
        <div className="rounded-lg border border-ca-outline-variant/50 bg-ca-surface-container/40 px-4 py-3 text-sm text-ca-on-surface-variant">
          {actionError}
          <button
            type="button"
            className="ml-3 font-label text-ca-label-sm font-medium text-ca-primary hover:underline"
            onClick={() => setActionError(null)}
          >
            닫기
          </button>
        </div>
      ) : null}
      {!loading && !loadError ? section : null}
    </div>
  );
}
