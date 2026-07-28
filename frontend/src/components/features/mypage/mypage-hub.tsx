"use client";

import { Bookmark, LayoutGrid, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";

import { MyPageDataLoadingShell } from "@/components/auth/mypage-auth-loading-shell";
import { MyPageAccount } from "@/components/features/mypage/mypage-account";
import { MyPageOverview } from "@/components/features/mypage/mypage-overview";
import { MyPageSavedBuilds } from "@/components/features/mypage/mypage-saved-builds";
import { useAuthHeader } from "@/components/layout/auth-controls";
import { Button, buttonClassName } from "@/components/ui/button";
import { fetchAccountSecuritySummary, type AccountSecuritySummary } from "@/lib/api/auth";
import { getPublicApiBase } from "@/lib/api/client";
import {
  listLocalGuestBookmarks,
  listSavedRecommendationBookmarks,
  mergeSavedBookmarkLists,
  removeSavedRecommendationBookmark,
  subscribeSavedBookmarksChanged,
  type SavedRecommendationItem,
} from "@/lib/api/saved-recommendations";
import { makeResultSnapshotId, removeResultSnapshot } from "@/lib/saved-result-snapshots";
import { cn } from "@/lib/utils";

type SectionId = "overview" | "saved" | "account";
type SavedLoadState = "idle" | "loading" | "success" | "error";

const SECTIONS: { id: SectionId; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "취향 요약", icon: LayoutGrid },
  { id: "saved", label: "저장한 결과", icon: Bookmark },
  { id: "account", label: "계정 설정", icon: Settings },
];

function formatJoinedKo(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

const SECTION_IDS = new Set<SectionId>(SECTIONS.map((s) => s.id));

const SAVED_LOAD_ERROR_TITLE = "저장한 결과를 불러오지 못했어요.";
const SAVED_LOAD_ERROR_HINT = "잠시 후 다시 시도해 주세요.";

function parseSection(raw: string | null): SectionId | null {
  if (!raw) return null;
  if (raw === "activity") return "saved";
  return SECTION_IDS.has(raw as SectionId) ? (raw as SectionId) : null;
}

function savedItemKey(item: SavedRecommendationItem): string {
  return `${item.request_id}:${item.build_id}:${item.saved_at}`;
}

function SavedListLoadingShell() {
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
      <p className="sr-only">저장한 결과를 불러오는 중입니다…</p>
    </div>
  );
}

export function MyPageHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useAuthHeader();
  const sectionFromUrl = parseSection(searchParams.get("section"));
  const [active, setActive] = useState<SectionId>(sectionFromUrl ?? "overview");
  const [savedLoadState, setSavedLoadState] = useState<SavedLoadState>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<SavedRecommendationItem[]>([]);
  const [securitySummary, setSecuritySummary] = useState<AccountSecuritySummary | null>(null);
  const [removingKeys, setRemovingKeys] = useState<Set<string>>(new Set());
  const loadSeqRef = useRef(0);
  const loadedForUserIdRef = useRef<string | null>(null);

  const resetSavedData = useCallback(() => {
    setSavedItems([]);
    setSecuritySummary(null);
    setLoadError(null);
    setActionError(null);
  }, []);

  const loadExtras = useCallback(
    async (forUserId: string) => {
      const seq = ++loadSeqRef.current;
      setSavedLoadState("loading");
      setLoadError(null);
      setActionError(null);

      try {
        if (!getPublicApiBase()) {
          throw new Error("서비스 연결을 확인한 뒤 다시 시도해 주세요.");
        }
        // Do not use listSavedBookmarksWithLocalFallback here — it swallows API
        // failures into a local-only list and looks like a successful empty state.
        const remote = await listSavedRecommendationBookmarks({ limit: 100 });
        if (seq !== loadSeqRef.current || loadedForUserIdRef.current !== forUserId) return;

        const local = listLocalGuestBookmarks({ limit: 100 });
        setSavedItems(mergeSavedBookmarkLists(remote, local));

        try {
          const summary = await fetchAccountSecuritySummary();
          if (seq !== loadSeqRef.current || loadedForUserIdRef.current !== forUserId) return;
          setSecuritySummary(summary);
        } catch {
          if (seq !== loadSeqRef.current || loadedForUserIdRef.current !== forUserId) return;
          setSecuritySummary(null);
        }

        setSavedLoadState("success");
      } catch (e) {
        if (seq !== loadSeqRef.current || loadedForUserIdRef.current !== forUserId) return;
        // Keep previous items only if still same user; never treat failure as [].
        setLoadError(e instanceof Error && e.message.trim() ? e.message : SAVED_LOAD_ERROR_HINT);
        setSavedLoadState("error");
      }
    },
    [],
  );

  useEffect(() => {
    const userId = user?.id ?? null;
    if (!userId) {
      loadSeqRef.current += 1;
      loadedForUserIdRef.current = null;
      resetSavedData();
      setSavedLoadState("idle");
      return;
    }

    // User changed or hub remounted — clear prior account data before fetch.
    loadedForUserIdRef.current = userId;
    resetSavedData();
    void loadExtras(userId);
  }, [loadExtras, resetSavedData, user?.id]);

  useEffect(() => {
    return subscribeSavedBookmarksChanged((detail) => {
      if (savedLoadState !== "success") return;
      if (detail.type === "upsert") {
        setSavedItems((prev) => mergeSavedBookmarkLists([detail.item], prev));
        return;
      }
      setSavedItems((prev) =>
        prev.filter((item) => item.build_id.trim().toLowerCase() !== detail.build_id.trim().toLowerCase()),
      );
    });
  }, [savedLoadState]);

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

  const retryLoad = useCallback(() => {
    const userId = user?.id;
    if (!userId) return;
    void loadExtras(userId);
  }, [loadExtras, user?.id]);

  const section = useMemo(() => {
    if (!user) {
      return (
        <div className="rounded-xl border-2 border-[rgb(220_220_238)] bg-white p-5 shadow-sm dark:border-border dark:bg-ca-surface-container sm:p-6">
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

    const dataPending = savedLoadState === "idle" || savedLoadState === "loading";

    if (active === "overview") {
      if (dataPending) return <MyPageDataLoadingShell />;
      return <MyPageOverview user={user} savedItems={savedItems} />;
    }

    if (active === "saved") {
      if (dataPending) return <SavedListLoadingShell />;
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
  }, [active, removingKeys, savedItems, savedLoadState, securitySummary, setUser, user]);

  const displayName = user?.display_name?.trim() || user?.email || "";
  const initial = (displayName[0] ?? "K").toUpperCase();
  const joined = user ? formatJoinedKo(user.created_at) : null;

  return (
    <div data-testid="e2e-mypage-hub">
      {user ? (
        <div className="border-b border-[rgb(220_220_238)] bg-white dark:border-border dark:bg-ca-surface">
          <div className="mx-auto max-w-4xl px-ca-margin-mobile py-8 sm:px-ca-margin">
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
                aria-hidden
              >
                {initial}
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-primary">마이페이지</p>
                <h1 className="truncate font-headline text-2xl font-extrabold tracking-tight text-ca-on-surface">
                  {displayName}
                </h1>
                <p className="truncate text-sm text-ca-on-surface-variant">
                  {user.email}
                  {joined ? ` · ${joined} 가입` : null}
                </p>
              </div>
            </div>

            <div
              className="-mb-px mt-6 flex gap-1 border-b border-[rgb(220_220_238)] dark:border-border"
              role="tablist"
              aria-label="마이페이지 섹션"
            >
              {SECTIONS.map((tab) => {
                const Icon = tab.icon;
                const selected = tab.id === active;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    className={cn(
                      "inline-flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
                      selected
                        ? "border-primary text-primary"
                        : "border-transparent text-ca-on-surface-variant hover:text-primary",
                    )}
                    onClick={() => selectSection(tab.id)}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-4xl space-y-6 px-ca-margin-mobile py-8 sm:px-ca-margin">
        {savedLoadState === "error" ? (
          <div
            className="rounded-xl border-2 border-[rgb(220_220_238)] bg-white p-5 shadow-sm dark:border-border dark:bg-ca-surface-container sm:p-6"
            data-testid="e2e-mypage-load-error"
          >
            <h2 className="font-headline text-lg font-semibold text-ca-on-surface">{SAVED_LOAD_ERROR_TITLE}</h2>
            <p className="mt-1 break-keep text-sm leading-relaxed text-ca-on-surface-variant">
              {SAVED_LOAD_ERROR_HINT}
            </p>
            {loadError && loadError !== SAVED_LOAD_ERROR_HINT ? (
              <p className="mt-2 break-keep text-xs text-ca-on-surface-variant">{loadError}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" onClick={retryLoad}>
                다시 불러오기
              </Button>
              <Link href="/auth?force=1" className={buttonClassName({ variant: "outline" })}>
                계정 전환
              </Link>
            </div>
          </div>
        ) : null}

        {savedLoadState !== "error" && actionError ? (
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

        {savedLoadState !== "error" ? section : null}
      </div>
    </div>
  );
}
