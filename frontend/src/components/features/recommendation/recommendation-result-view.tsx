"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  bookmarkPayloadFromBuild,
  emitExplorationEvent,
  findSavedBookmarkByBuildId,
  getOrCreateClientSessionId,
  listLocalGuestBookmarks,
  listSavedRecommendationBookmarks,
  saveLocalGuestBookmark,
  saveRecommendationBookmark,
  type SavedRecommendationItem,
} from "@/lib/api/saved-recommendations";
import { ApiError } from "@/lib/api/client";
import { fetchCatalogPart, type CatalogFamily } from "@/lib/api/catalog";
import { emitResultsUxEventBestEffort } from "@/lib/api/onboarding-events";
import { getPublicApiBase } from "@/lib/api/client";
import { isCanonicalSwagkeyProductUrl, pickSourceUrlKey } from "@/lib/swagkey-source-links";
import { resolveLayoutSizeFromMetadata } from "@/lib/layout-size";
import { layoutArchetypeMetadata } from "@/components/features/catalog/layout-diagram/layout-archetype-metadata";
import { useAuthHeader } from "@/components/layout/auth-controls";
import { makeResultSnapshotId, saveResultSnapshot } from "@/lib/saved-result-snapshots";
import { recommendKeyboardStack } from "@/recommendation-engine/recommend";
import { buildPreferenceVectorFromSubmission } from "@/nl-preference/merge-submission";
import { topTraitHighlights } from "@/lib/trait-display";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecommendedBuild } from "@/types/recommendation";
import type { SurveySubmission } from "@/types/survey";

import { HelpHint } from "./results/help-hint";
import { MetricGuideCard } from "./results/metric-guide-card";
import { ResultsCompareTab } from "./results/results-compare-tab";
import { catalogPickMetadata } from "./results/results-build-utils";
import { DISPLAY_K } from "./results/results-constants";
import { ResultsHeaderActions } from "./results/results-header-actions";
import { ResultsNextActions } from "./results/results-next-actions";
import { ResultsOverviewCtaBand } from "./results/results-overview-cta-band";
import { ResultsOverviewTab } from "./results/results-overview-tab";
import { ResultsPageShell } from "./results/results-page-shell";
import { ResultsTrustLayer } from "./results/results-trust-layer";
import type { ResultTabId } from "./results/results-types";
import { deriveConfidenceStory } from "./results/results-confidence-story-content";
import { ResultsEvidenceMatchSection } from "./results/results-evidence-match-section";
import { ResultsPreferenceSummary, preferenceTagsFromAnswers } from "./results/shared-result-header";

const ResultsEvidenceTab = dynamic(
  () =>
    import("./results/results-evidence-tab").then((m) => ({
      default: m.ResultsEvidenceTab,
    })),
  {
    loading: () => (
      <div
        className="min-h-[20rem] animate-pulse rounded-xl border border-ca-outline-variant/35 bg-ca-surface-container/40 motion-reduce:animate-none"
        aria-busy="true"
        aria-label="근거 탭 불러오는 중"
      />
    ),
  },
);

type Props = {
  submission: SurveySubmission;
  build: RecommendedBuild;
  onApplyRefinement?: (
    patch: Partial<SurveySubmission["answers"]>,
    meta?: { label?: string; stepId: string; answerId: string },
  ) => Promise<void>;
  refineError?: string | null;
};

export function RecommendationResultView({ submission, build, onApplyRefinement, refineError }: Props) {
  const SAVE_FEEDBACK_MIN_MS = 350;
  const { answers, traits } = submission;
  const { sourceUrls } = build;
  const traitBadges = topTraitHighlights(traits, 6);

  const apiPicks = useMemo(
    () => submission.recommendations ?? submission.matchExplanations ?? [],
    [submission.matchExplanations, submission.recommendations],
  );
  const [enrichedSourceUrls, setEnrichedSourceUrls] = useState<Record<string, string>>({});
  const [enrichedImageUrls, setEnrichedImageUrls] = useState<Record<string, string>>({});
  const [enrichedLayoutSizes, setEnrichedLayoutSizes] = useState<Record<string, string>>({});
  const enrichmentAttemptedRef = useRef(new Set<string>());
  const viewEventsSentRef = useRef<string | null>(null);
  const enrichedApiPicks = useMemo(
    () =>
      apiPicks.map((pick) => {
        const key = pickSourceUrlKey(pick.domain, pick.itemId);
        const imageUrl = pick.imageUrl?.trim() || enrichedImageUrls[key];
        if (!imageUrl) return pick;
        return { ...pick, imageUrl };
      }),
    [apiPicks, enrichedImageUrls],
  );
  const catalogPickMeta = useMemo(() => catalogPickMetadata(enrichedApiPicks), [enrichedApiPicks]);
  const useBackendScoring =
    submission.source === "api" && !submission.apiUnreachableFallback && apiPicks.length > 0;

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveScope, setSaveScope] = useState<"account" | "local" | null>(null);
  const [applyingRefine, setApplyingRefine] = useState(false);
  const [saveCollection, setSaveCollection] = useState("일반");
  // Reuse AuthHeaderProvider session (single GET /auth/me) — avoid a second fetch.
  const { user: authUser, authChecked } = useAuthHeader();
  const isAuthenticated = authChecked && !!authUser;
  const sessionId = useMemo(() => getOrCreateClientSessionId(), []);
  const saveInFlightRef = useRef(false);
  const [activeTab, setActiveTab] = useState<ResultTabId>("overview");

  const applySavedState = useCallback((scope: "account" | "local", message = "") => {
    setSaveScope(scope);
    setSaveState("saved");
    setSaveMessage(message);
  }, []);

  const applySaveErrorState = useCallback((message: string) => {
    setSaveScope(null);
    setSaveState("error");
    setSaveMessage(message);
  }, []);

  const mapSaveErrorMessage = useCallback((error: unknown): string => {
    const networkHint = "저장하지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
    const genericHint = "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    const looksLikeNetworkFailure = (message: string) =>
      /failed to fetch|networkerror|network request failed|load failed/i.test(message);

    if (error instanceof ApiError) {
      if (error.status === 401) return "저장하지 못했습니다. 로그인 상태를 다시 확인해 주세요.";
      if (error.status === 409) return "이미 저장된 결과입니다.";
      if (error.status === 0 || looksLikeNetworkFailure(error.message)) return networkHint;
      if (error.status >= 500) return genericHint;
      // Prefer Korean copy over raw English API/detail strings.
      if (!/[가-힣]/.test(error.message)) return genericHint;
      return error.message || genericHint;
    }
    if (error instanceof Error) {
      if (looksLikeNetworkFailure(error.message)) return networkHint;
      return genericHint;
    }
    return genericHint;
  }, []);

  const ensureMinimumSavingFeedback = useCallback(async (startedAt: number) => {
    const elapsed = Date.now() - startedAt;
    if (elapsed >= SAVE_FEEDBACK_MIN_MS) return;
    await new Promise((resolve) => window.setTimeout(resolve, SAVE_FEEDBACK_MIN_MS - elapsed));
  }, [SAVE_FEEDBACK_MIN_MS]);

  useEffect(() => {
    if (!useBackendScoring) return;
    if (viewEventsSentRef.current === build.id) return;
    viewEventsSentRef.current = build.id;
    const requestId = globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}`;
    const meta = {
      buildId: build.id,
      source: "results_view",
      ...catalogPickMetadata(apiPicks),
    };
    void emitExplorationEvent({
      event_type: "interaction.click",
      request_id: requestId,
      session_id: sessionId,
      scenario_id: "results_view",
      metadata: meta,
    }).catch(() => undefined);
    const visitKey = `kr_results_visit_${build.id}`;
    const visitCount = Number(window.sessionStorage.getItem(visitKey) ?? "0") + 1;
    window.sessionStorage.setItem(visitKey, String(visitCount));
    const revisitType = visitCount <= 1 ? "interaction.revisit" : "interaction.repeated_view";
    void emitExplorationEvent({
      event_type: revisitType,
      request_id: globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}-rv`,
      session_id: sessionId,
      scenario_id: "results_view",
      metadata: meta,
    }).catch(() => undefined);
  }, [apiPicks, build.id, sessionId, useBackendScoring]);

  useEffect(() => {
    setSaveState("idle");
    setSaveScope(null);
    setSaveMessage("");
  }, [build.id, isAuthenticated]);

  useEffect(() => {
    if (!authChecked) return;
    let cancelled = false;
    const buildId = build.id;
    if (isAuthenticated) {
      void listSavedRecommendationBookmarks({ limit: 100 })
        .then((items) => {
          if (cancelled) return;
          if (findSavedBookmarkByBuildId(items, buildId)) {
            applySavedState("account");
          }
        })
        .catch(() => undefined);
      return () => {
        cancelled = true;
      };
    }
    const local = listLocalGuestBookmarks({ limit: 100 });
    if (findSavedBookmarkByBuildId(local, buildId)) {
      applySavedState("local");
    }
    return () => {
      cancelled = true;
    };
  }, [authChecked, applySavedState, build.id, isAuthenticated]);

  // Seed layout sizes from archetype metadata (no network, stable setState).
  useEffect(() => {
    const layoutSizeUpdates: Record<string, string> = {};
    for (const pick of apiPicks) {
      if (pick.domain.toLowerCase() !== "layout") continue;
      const archetypeSize = layoutArchetypeMetadata(pick.itemId).layout_size;
      if (typeof archetypeSize !== "string" || !archetypeSize.trim()) continue;
      layoutSizeUpdates[pickSourceUrlKey("layout", pick.itemId)] = archetypeSize.trim();
    }
    if (Object.keys(layoutSizeUpdates).length === 0) return;
    setEnrichedLayoutSizes((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [key, value] of Object.entries(layoutSizeUpdates)) {
        if (prev[key] === value) continue;
        next[key] = value;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [apiPicks]);

  useEffect(() => {
    enrichmentAttemptedRef.current.clear();
  }, [apiPicks]);

  useEffect(() => {
    if (!getPublicApiBase()) return;
    const targets = new Map<string, { family: CatalogFamily; itemId: string }>();

    const catalogFamilyForDomain = (domain: string): CatalogFamily | null => {
      const d = domain.toLowerCase();
      if (d === "switch" || d === "plate" || d === "foam" || d === "layout" || d === "case" || d === "keycap") {
        return d;
      }
      return null;
    };

    const hasResolved = (domain: string, itemId: string, existingUrl?: string) => {
      if (isCanonicalSwagkeyProductUrl(existingUrl)) return true;
      if (isCanonicalSwagkeyProductUrl(enrichedSourceUrls[pickSourceUrlKey(domain, itemId)])) return true;
      const pick = apiPicks.find((row) => row.domain.toLowerCase() === domain && row.itemId === itemId);
      if (isCanonicalSwagkeyProductUrl(pick?.sourceUrl)) return true;
      for (const row of apiPicks) {
        if (row.domain.toLowerCase() !== domain) continue;
        const alt = row.alternatives?.find((candidate) => candidate.itemId === itemId);
        if (isCanonicalSwagkeyProductUrl(alt?.sourceUrl)) return true;
      }
      const primaryPick = apiPicks.find((row) => row.domain.toLowerCase() === domain);
      const buildUrl = sourceUrls?.[domain as keyof typeof sourceUrls];
      if (primaryPick?.itemId === itemId && isCanonicalSwagkeyProductUrl(buildUrl)) return true;
      return false;
    };

    const hasImageUrl = (domain: string, itemId: string, existingUrl?: string) => {
      if (existingUrl?.trim()) return true;
      if (enrichedImageUrls[pickSourceUrlKey(domain, itemId)]?.trim()) return true;
      const pick = apiPicks.find((row) => row.domain.toLowerCase() === domain && row.itemId === itemId);
      if (pick?.imageUrl?.trim()) return true;
      for (const row of apiPicks) {
        if (row.domain.toLowerCase() !== domain) continue;
        const alt = row.alternatives?.find((candidate) => candidate.itemId === itemId);
        if (alt?.imageUrl?.trim()) return true;
      }
      return false;
    };

    const queueTarget = (key: string, family: CatalogFamily, itemId: string) => {
      if (enrichmentAttemptedRef.current.has(key)) return;
      targets.set(key, { family, itemId });
    };

    for (const pick of apiPicks) {
      const domain = pick.domain.toLowerCase();
      const family = catalogFamilyForDomain(domain);
      if (!family) continue;
      const candidates = [
        { itemId: pick.itemId, sourceUrl: pick.sourceUrl, imageUrl: pick.imageUrl },
        ...(pick.alternatives ?? []).map((alt) => ({
          itemId: alt.itemId,
          sourceUrl: alt.sourceUrl,
          imageUrl: alt.imageUrl,
        })),
      ];
      for (const candidate of candidates) {
        if (!candidate.itemId) continue;
        const needsSourceUrl = !hasResolved(domain, candidate.itemId, candidate.sourceUrl);
        const needsImageUrl = !hasImageUrl(domain, candidate.itemId, candidate.imageUrl);
        if (!needsSourceUrl && !needsImageUrl) continue;
        queueTarget(pickSourceUrlKey(domain, candidate.itemId), family, candidate.itemId);
      }

      if (domain === "layout" || domain === "case") {
        const key = pickSourceUrlKey(domain, pick.itemId);
        if (enrichedLayoutSizes[key]) continue;
        if (domain === "layout") {
          const archetypeSize = layoutArchetypeMetadata(pick.itemId).layout_size;
          if (typeof archetypeSize === "string" && archetypeSize.trim()) continue;
        }
        queueTarget(key, family, pick.itemId);
      }
    }

    if (targets.size === 0) return;

    for (const key of targets.keys()) {
      enrichmentAttemptedRef.current.add(key);
    }

    let cancelled = false;
    void (async () => {
      const sourceUpdates: Record<string, string> = {};
      const imageUpdates: Record<string, string> = {};
      const layoutUpdates: Record<string, string> = {};
      for (const [key, { family, itemId }] of targets) {
        try {
          const part = await fetchCatalogPart(family, itemId);
          const url = part?.sourceUrl?.trim();
          if (url && isCanonicalSwagkeyProductUrl(url)) {
            sourceUpdates[key] = url;
          }
          const imageUrl = part?.imageUrl?.trim();
          if (imageUrl) {
            imageUpdates[key] = imageUrl;
          }
          const layoutSize = resolveLayoutSizeFromMetadata(part.metadata);
          if (layoutSize) {
            layoutUpdates[key] = layoutSize;
          }
        } catch {
          /* ignore per-part failures */
        }
      }
      if (cancelled) return;
      if (Object.keys(sourceUpdates).length > 0) {
        setEnrichedSourceUrls((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const [key, value] of Object.entries(sourceUpdates)) {
            if (prev[key] === value) continue;
            next[key] = value;
            changed = true;
          }
          return changed ? next : prev;
        });
      }
      if (Object.keys(imageUpdates).length > 0) {
        setEnrichedImageUrls((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const [key, value] of Object.entries(imageUpdates)) {
            if (prev[key] === value) continue;
            next[key] = value;
            changed = true;
          }
          return changed ? next : prev;
        });
      }
      if (Object.keys(layoutUpdates).length > 0) {
        setEnrichedLayoutSizes((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const [key, value] of Object.entries(layoutUpdates)) {
            if (prev[key] === value) continue;
            next[key] = value;
            changed = true;
          }
          return changed ? next : prev;
        });
      }
    })();
    return () => {
      cancelled = true;
    };
    // Deliberately omit enriched* maps: attempted-ref gates one fetch per key; re-running
    // on enrich updates caused cancel/retry storms (layout-007 + events in Lighthouse).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above
  }, [apiPicks, sourceUrls]);

  async function handleSaveBuild() {
    if (saveInFlightRef.current || saveState === "saved") return;
    if (!authChecked) {
      applySaveErrorState("로그인 상태를 확인하는 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    saveInFlightRef.current = true;
    const authenticated = isAuthenticated;
    if (!authenticated) {
      const saveStartedAt = Date.now();
      setSaveState("saving");
      setSaveScope(null);
      setSaveMessage("저장하는 중…");
      try {
        const base = bookmarkPayloadFromBuild(build);
        const requestId = globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}`;
        const snapshotId = makeResultSnapshotId(requestId, base.build_id);
        saveResultSnapshot(snapshotId, submission);
        const savedItem = saveLocalGuestBookmark({
          request_id: requestId,
          session_id: sessionId,
          scenario_id: "results_ui",
          ...base,
          metadata: {
            source: "guest_local",
            recommendationCount: apiPicks.length,
            collection: saveCollection,
            resultSnapshotId: snapshotId,
            resultSnapshot: submission,
            preferenceTags: preferenceTagsFromAnswers(submission.answers).slice(0, 3),
            ...(submission.userTraitScores ? { userTraitScores: submission.userTraitScores } : {}),
            ...(submission.completedAtIso ? { recommendedAt: submission.completedAtIso } : {}),
            ...catalogPickMeta,
          },
        });
        void emitExplorationEvent({
          event_type: "interaction.bookmark",
          request_id: requestId,
          session_id: sessionId,
          scenario_id: "results_ui_guest",
          metadata: {
            buildId: base.build_id,
            title: base.title,
            collection: saveCollection,
            source: "guest_local",
            resultSnapshotId: snapshotId,
            ...(submission.userTraitScores ? { userTraitScores: submission.userTraitScores } : {}),
            ...(submission.completedAtIso ? { recommendedAt: submission.completedAtIso } : {}),
            ...catalogPickMeta,
          },
        }).catch(() => undefined);
        void emitExplorationEvent({
          event_type: "interaction.collection_tag",
          request_id: globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}-col`,
          session_id: sessionId,
          scenario_id: "results_ui_guest",
          metadata: {
            collection: saveCollection,
            collectionLabel: saveCollection,
            buildId: base.build_id,
            ...catalogPickMeta,
          },
        }).catch(() => undefined);
        await ensureMinimumSavingFeedback(saveStartedAt);
        applySavedState(
          "local",
          savedItem.request_id !== requestId ? "이미 이 브라우저에 저장된 결과입니다." : "이 브라우저에 저장했습니다.",
        );
      } catch (e) {
        await ensureMinimumSavingFeedback(saveStartedAt);
        applySaveErrorState(mapSaveErrorMessage(e));
      } finally {
        saveInFlightRef.current = false;
      }
      return;
    }
    const saveStartedAt = Date.now();
    setSaveState("saving");
    setSaveScope(null);
    setSaveMessage("저장하는 중…");
    try {
      const base = bookmarkPayloadFromBuild(build);
      const requestId = globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}`;
      const snapshotId = makeResultSnapshotId(requestId, base.build_id);
      saveResultSnapshot(snapshotId, submission);
      const bookmarkInput = {
        request_id: requestId,
        session_id: sessionId,
        scenario_id: "results_ui",
        ...base,
        metadata: {
          source: "results_ui",
          recommendationCount: apiPicks.length,
          collection: saveCollection,
          resultSnapshotId: snapshotId,
          resultSnapshot: submission,
          preferenceTags: preferenceTagsFromAnswers(submission.answers).slice(0, 3),
          ...(submission.userTraitScores ? { userTraitScores: submission.userTraitScores } : {}),
          ...(submission.completedAtIso ? { recommendedAt: submission.completedAtIso } : {}),
          ...catalogPickMeta,
        },
      };
      const result = await saveRecommendationBookmark(bookmarkInput);
      if (!result.saved) {
        saveLocalGuestBookmark(bookmarkInput);
        if (result.reason === "login_required") {
          await ensureMinimumSavingFeedback(saveStartedAt);
          applySaveErrorState(
            "계정에 저장하지 못했습니다. 로그인 상태가 만료되었을 수 있어요. 이 브라우저에는 임시로 보관했으니 다시 로그인 후 저장해 주세요.",
          );
          return;
        }
        await ensureMinimumSavingFeedback(saveStartedAt);
        applySaveErrorState(
          result.reason === "evaluation_persistence_disabled"
            ? "계정 저장을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요."
            : "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
        return;
      }
      const savedItem = result.item as SavedRecommendationItem | null;
      const alreadySaved =
        result.reason === "already_saved" || (savedItem ? savedItem.request_id !== requestId : false);
      await ensureMinimumSavingFeedback(saveStartedAt);
      applySavedState("account", alreadySaved ? "이미 계정에 저장된 결과입니다." : "계정에 저장했습니다.");
      void emitExplorationEvent({
        event_type: "interaction.collection_tag",
        request_id: globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}-col`,
        session_id: sessionId,
        scenario_id: "results_ui",
        metadata: {
          collection: saveCollection,
          collectionLabel: saveCollection,
          buildId: base.build_id,
          ...catalogPickMeta,
        },
      }).catch(() => undefined);
    } catch (e) {
      await ensureMinimumSavingFeedback(saveStartedAt);
      applySaveErrorState(mapSaveErrorMessage(e));
    } finally {
      saveInFlightRef.current = false;
    }
  }

  async function handleApplyRefinement(stepId: string, answerId: string, label?: string): Promise<void> {
    if (!onApplyRefinement) return;
    setApplyingRefine(true);
    try {
      await onApplyRefinement({ [stepId]: answerId } as Partial<SurveySubmission["answers"]>, {
        label,
        stepId,
        answerId,
      });
    } finally {
      setApplyingRefine(false);
    }
  }

  const handleTabChange = useCallback(
    (tab: ResultTabId) => {
      void emitResultsUxEventBestEffort("interaction.results_tab_click", {
        tab,
        buildId: build.id,
      }).catch(() => undefined);
      setActiveTab(tab);
    },
    [build.id],
  );

  if (useBackendScoring) {
    const shareStory = deriveConfidenceStory(submission, enrichedApiPicks);
    const shareTaste = {
      v: 1 as const,
      title: `${preferenceTagsFromAnswers(submission.answers)[1] ?? "취향"} · 추천 요약`,
      tags: preferenceTagsFromAnswers(submission.answers),
      why: shareStory?.support,
    };
    // Prefer title from header pattern (sound · feel) without importing maps again:
    const soundFeelTitle = (() => {
      const tags = preferenceTagsFromAnswers(submission.answers);
      return tags.length >= 2 ? `${tags[1]} · ${tags[2] ?? tags[0]}` : tags[0] ?? "취향 카드";
    })();
    shareTaste.title = soundFeelTitle;

    return (
      <ResultsPageShell
        submission={submission}
        build={build}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        headerActions={
          <ResultsHeaderActions
            submission={submission}
            build={build}
            isAuthenticated={isAuthenticated}
            authReady={authChecked}
            saveState={saveState}
            onSaveBuild={() => void handleSaveBuild()}
            shareTaste={shareTaste}
          />
        }
      >
        {activeTab === "overview" ? (
          <div className="space-y-6 sm:space-y-8">
            <ResultsOverviewTab
              submission={submission}
              build={build}
              apiPicks={enrichedApiPicks}
              enrichedSourceUrls={enrichedSourceUrls}
              enrichedLayoutSizes={enrichedLayoutSizes}
              applyingRefine={applyingRefine}
              refineError={refineError}
              onApplyRefinement={(stepId, answerId, label) => void handleApplyRefinement(stepId, answerId, label)}
              isAuthenticated={isAuthenticated}
              sections="parts"
            />
            <ResultsTrustLayer
              submission={submission}
              build={build}
              apiPicks={enrichedApiPicks}
              applyingRefine={applyingRefine}
              onApplyRefinement={(stepId, answerId, label) => void handleApplyRefinement(stepId, answerId, label)}
            />
            <ResultsPreferenceSummary answers={submission.answers} />
            <ResultsNextActions
              build={build}
              apiPicks={enrichedApiPicks}
              enrichedSourceUrls={enrichedSourceUrls}
              isAuthenticated={isAuthenticated}
              authReady={authChecked}
              saveState={saveState}
              saveScope={saveScope}
              saveMessage={saveMessage}
              onSaveBuild={() => void handleSaveBuild()}
              shareTaste={shareTaste}
              showSave={false}
              showShare={false}
            />
            <ResultsOverviewCtaBand
              isAuthenticated={isAuthenticated}
              authReady={authChecked}
              saveState={saveState}
              onSaveBuild={() => void handleSaveBuild()}
            />
            <ResultsOverviewTab
              submission={submission}
              build={build}
              apiPicks={enrichedApiPicks}
              enrichedSourceUrls={enrichedSourceUrls}
              enrichedLayoutSizes={enrichedLayoutSizes}
              applyingRefine={applyingRefine}
              refineError={refineError}
              onApplyRefinement={(stepId, answerId, label) => void handleApplyRefinement(stepId, answerId, label)}
              isAuthenticated={isAuthenticated}
              sections="secondary"
            />
          </div>
        ) : null}

        {activeTab === "evidence" ? (
          <ResultsEvidenceTab
            submission={submission}
            build={build}
            apiPicks={enrichedApiPicks}
            enrichedSourceUrls={enrichedSourceUrls}
          />
        ) : null}

        {activeTab === "compare" ? (
          <ResultsCompareTab submission={submission} build={build} apiPicks={enrichedApiPicks} />
        ) : null}
      </ResultsPageShell>
    );
  }

  const userVector = buildPreferenceVectorFromSubmission(submission);
  const engine = recommendKeyboardStack(userVector, undefined, { topKLists: DISPLAY_K });

  const switches = engine.ranked.switches.slice(0, DISPLAY_K);

  const liteShareTaste = {
    v: 1 as const,
    title: preferenceTagsFromAnswers(submission.answers).slice(0, 2).join(" · ") || "취향 카드",
    tags: preferenceTagsFromAnswers(submission.answers),
  };

  return (
    <ResultsPageShell
      submission={submission}
      build={build}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      headerActions={
        <ResultsHeaderActions
          submission={submission}
          build={build}
          isAuthenticated={isAuthenticated}
          authReady={authChecked}
          saveState={saveState}
          onSaveBuild={() => void handleSaveBuild()}
          shareTaste={liteShareTaste}
        />
      }
    >
      {activeTab === "overview" ? (
        <div className="space-y-8">
          {submission.apiUnreachableFallback ? (
            <Card className="border-amber-500/40 bg-amber-500/10 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-amber-950 dark:text-amber-100">연결이 불안정해요</CardTitle>
                <CardDescription className="text-amber-900/90 dark:text-amber-100/90">
                  네트워크 문제로 기본 추천 모드로 결과를 생성했습니다. 잠시 후 다시 시도해 주세요.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {submission.nlPreferenceText?.trim() ? (
            <Card className="rounded-xl border border-ca-outline-variant/40 bg-ca-surface-container-lowest shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">자유 입력 취향</CardTitle>
                <CardDescription>
                  입력한 문장을 바탕으로 취향을 분석해 추천에 함께 반영했습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="rounded-lg border border-ca-outline-variant/35 p-3 text-sm text-ca-on-surface-variant">
                  {submission.nlPreferenceText.trim()}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <div className="space-y-2">
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-ca-on-surface">
              설문 기반 핵심 성향
              <HelpHint text="설문 답변에서 특히 강하게 드러난 취향 축을 요약한 배지입니다. 점수가 클수록 해당 성향이 더 뚜렷합니다." />
            </p>
            <div className="flex flex-wrap gap-2">
              {traitBadges.map((t) => (
                <Badge key={t.key} className="border-ca-outline-variant/50 bg-transparent font-normal">
                  {t.label} (+{t.score})
                </Badge>
              ))}
            </div>
          </div>

          <MetricGuideCard />

          <ResultsNextActions
            build={build}
            apiPicks={[]}
            enrichedSourceUrls={{}}
            isAuthenticated={isAuthenticated}
            authReady={authChecked}
            saveState={saveState}
            saveScope={saveScope}
            saveMessage={saveMessage}
            onSaveBuild={() => void handleSaveBuild()}
            shareTaste={liteShareTaste}
            showSave={false}
            showShare={false}
          />
          <ResultsOverviewCtaBand
            isAuthenticated={isAuthenticated}
            authReady={authChecked}
            saveState={saveState}
            onSaveBuild={() => void handleSaveBuild()}
          />
        </div>
      ) : null}

      {activeTab === "evidence" ? (
        <ResultsEvidenceMatchSection submission={submission} />
      ) : null}

      {activeTab === "compare" ? (
        <ResultsCompareTab submission={submission} build={build} liteSwitches={switches} />
      ) : null}
    </ResultsPageShell>
  );
}
