import { ApiError, getPublicApiBase, readErrorMessage } from "@/lib/api/client";
import { getOrCreateClientSessionId } from "@/lib/client-session-id";
import type { RecommendedBuild } from "@/types/recommendation";
import { getOrCreateExperimentAssignments } from "@/lib/experiments";

export { getOrCreateClientSessionId };

export type SavedRecommendationItem = {
  saved_at: string;
  request_id: string;
  session_id?: string;
  scenario_id?: string;
  build_id: string;
  title: string;
  summary: string;
  components: Record<string, string>;
  metadata: Record<string, unknown>;
};

const LOCAL_BOOKMARKS_KEY = "kr_guest_saved_bookmarks";

type SaveRecommendationRequest = {
  request_id: string;
  session_id?: string;
  scenario_id?: string;
  build_id: string;
  title: string;
  summary: string;
  components: Record<string, string>;
  metadata?: Record<string, unknown>;
};

const SAVED_PATH = "/api/v1/recommendations/saved";
const ACTIVITY_PATH = "/api/v1/recommendations/activity";

export function saveLocalGuestBookmark(input: SaveRecommendationRequest): SavedRecommendationItem {
  const item: SavedRecommendationItem = {
    saved_at: new Date().toISOString(),
    request_id: input.request_id,
    session_id: input.session_id,
    scenario_id: input.scenario_id,
    build_id: input.build_id,
    title: input.title,
    summary: input.summary,
    components: input.components,
    metadata: input.metadata ?? {},
  };
  if (typeof window === "undefined") return item;
  const raw = window.localStorage.getItem(LOCAL_BOOKMARKS_KEY);
  const list = raw ? ((JSON.parse(raw) as SavedRecommendationItem[]) ?? []) : [];
  list.unshift(item);
  window.localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify(list.slice(0, 100)));
  return item;
}

export function listLocalGuestBookmarks(params?: {
  session_id?: string;
  scenario_id?: string;
  limit?: number;
}): SavedRecommendationItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LOCAL_BOOKMARKS_KEY);
  const list = raw ? ((JSON.parse(raw) as SavedRecommendationItem[]) ?? []) : [];
  const filtered = list.filter((item) => {
    if (params?.session_id && item.session_id !== params.session_id) return false;
    if (params?.scenario_id && item.scenario_id !== params.scenario_id) return false;
    return true;
  });
  const limit = typeof params?.limit === "number" ? params.limit : filtered.length;
  return filtered.slice(0, Math.max(1, limit));
}

export function removeLocalGuestBookmark(input: {
  request_id: string;
  build_id: string;
  saved_at?: string;
}): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(LOCAL_BOOKMARKS_KEY);
  const list = raw ? ((JSON.parse(raw) as SavedRecommendationItem[]) ?? []) : [];
  const next = list.filter((item) => {
    if (item.request_id !== input.request_id) return true;
    if (item.build_id !== input.build_id) return true;
    if (input.saved_at && item.saved_at !== input.saved_at) return true;
    return false;
  });
  if (next.length === list.length) return false;
  window.localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify(next));
  return true;
}

export type SaveRecommendationResult = {
  saved: boolean;
  reason?: string | null;
};

export function bookmarkActivityFromSaved(item: SavedRecommendationItem): RecommendationActivityItem {
  return {
    occurred_at: item.saved_at,
    event_type: "interaction.bookmark",
    request_id: item.request_id,
    session_id: item.session_id,
    scenario_id: item.scenario_id,
    metadata: {
      buildId: item.build_id,
      title: item.title,
      summary: item.summary,
      components: item.components,
      ...(item.metadata ?? {}),
    },
  };
}

function savedBookmarkKey(item: SavedRecommendationItem): string {
  return `${item.request_id}:${item.build_id}:${item.saved_at}`;
}

export function mergeSavedBookmarkLists(
  remote: SavedRecommendationItem[],
  local: SavedRecommendationItem[],
): SavedRecommendationItem[] {
  const seen = new Set<string>();
  const merged: SavedRecommendationItem[] = [];
  for (const item of [...remote, ...local]) {
    const key = savedBookmarkKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.sort((a, b) => +new Date(b.saved_at) - +new Date(a.saved_at));
}

export function mergeBookmarkActivity(
  fromActivity: RecommendationActivityItem[],
  savedItems: SavedRecommendationItem[],
): RecommendationActivityItem[] {
  const bookmarks = fromActivity.filter((it) => it.event_type === "interaction.bookmark");
  const seenAt = new Set(
    bookmarks.map((it) => `${it.request_id ?? ""}:${String(it.metadata?.buildId ?? "")}:${it.occurred_at}`),
  );
  const seenPair = new Set(
    bookmarks.map((it) => `${it.request_id ?? ""}:${String(it.metadata?.buildId ?? "")}`),
  );
  const extra = savedItems
    .map(bookmarkActivityFromSaved)
    .filter((it) => {
      const pair = `${it.request_id ?? ""}:${String(it.metadata?.buildId ?? "")}`;
      if (seenPair.has(pair)) return false;
      const atKey = `${it.request_id ?? ""}:${String(it.metadata?.buildId ?? "")}:${it.occurred_at}`;
      if (seenAt.has(atKey)) return false;
      seenAt.add(atKey);
      seenPair.add(pair);
      return true;
    });
  return [...bookmarks, ...extra].sort((a, b) => +new Date(b.occurred_at) - +new Date(a.occurred_at));
}

export async function listSavedBookmarksWithLocalFallback(params?: {
  session_id?: string;
  scenario_id?: string;
  limit?: number;
}): Promise<SavedRecommendationItem[]> {
  const local = listLocalGuestBookmarks(params);
  try {
    const remote = await listSavedRecommendationBookmarks(params);
    const merged = mergeSavedBookmarkLists(remote, local);
    const limit = typeof params?.limit === "number" ? params.limit : merged.length;
    return merged.slice(0, Math.max(1, limit));
  } catch {
    const limit = typeof params?.limit === "number" ? params.limit : local.length;
    return local.slice(0, Math.max(1, limit));
  }
}

export async function saveRecommendationBookmark(
  input: SaveRecommendationRequest,
): Promise<SaveRecommendationResult> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const res = await fetch(`${base}${SAVED_PATH}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new ApiError(res.status, await readErrorMessage(res));
  }
  const json = (await res.json()) as SaveRecommendationResult;
  return { saved: Boolean(json.saved), reason: json.reason ?? null };
}

export async function listSavedRecommendationBookmarks(params?: {
  session_id?: string;
  scenario_id?: string;
  limit?: number;
}): Promise<SavedRecommendationItem[]> {
  const base = getPublicApiBase();
  if (!base) return [];
  const q = new URLSearchParams();
  if (params?.session_id) q.set("session_id", params.session_id);
  if (params?.scenario_id) q.set("scenario_id", params.scenario_id);
  if (typeof params?.limit === "number") q.set("limit", String(params.limit));
  const url = `${base}${SAVED_PATH}${q.toString() ? `?${q.toString()}` : ""}`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, credentials: "include" });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  const json = (await res.json()) as { items?: SavedRecommendationItem[] };
  return Array.isArray(json.items) ? json.items : [];
}

export async function removeSavedRecommendationBookmark(input: {
  request_id: string;
  build_id: string;
  saved_at?: string;
}): Promise<boolean> {
  let remoteRemoved = false;
  const base = getPublicApiBase();
  if (base) {
    const tryRemove = async (body: { request_id: string; build_id: string; saved_at?: string }) => {
      const res = await fetch(`${base}${SAVED_PATH}/remove`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
      const json = (await res.json()) as { removed?: boolean };
      return Boolean(json.removed);
    };
    try {
      remoteRemoved = await tryRemove(input);
      // saved_at 타임존/정밀도 불일치로 not_found인 경우 request+build만으로 재시도
      if (!remoteRemoved && input.saved_at) {
        remoteRemoved = await tryRemove({
          request_id: input.request_id,
          build_id: input.build_id,
        });
      }
    } catch {
      remoteRemoved = false;
    }
  }
  const localRemoved = removeLocalGuestBookmark(input);
  return remoteRemoved || localRemoved;
}

export async function updateSavedRecommendationBookmark(input: {
  request_id: string;
  build_id: string;
  saved_at?: string;
  note: string;
}): Promise<boolean> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const res = await fetch(`${base}${SAVED_PATH}/update`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  const json = (await res.json()) as { updated?: boolean };
  return Boolean(json.updated);
}

export type RecommendationActivityItem = {
  occurred_at: string;
  event_type: string;
  request_id?: string;
  session_id?: string;
  scenario_id?: string;
  metadata: Record<string, unknown>;
};

export async function listRecommendationActivity(params?: {
  session_id?: string;
  scenario_id?: string;
  limit?: number;
}): Promise<RecommendationActivityItem[]> {
  const base = getPublicApiBase();
  if (!base) return [];
  const q = new URLSearchParams();
  if (params?.session_id) q.set("session_id", params.session_id);
  if (params?.scenario_id) q.set("scenario_id", params.scenario_id);
  if (typeof params?.limit === "number") q.set("limit", String(params.limit));
  const url = `${base}${ACTIVITY_PATH}${q.toString() ? `?${q.toString()}` : ""}`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, credentials: "include" });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  const json = (await res.json()) as { items?: RecommendationActivityItem[] };
  return Array.isArray(json.items) ? json.items : [];
}

export async function removeRecommendationActivity(input: {
  request_id: string;
  event_type: string;
  occurred_at?: string;
}): Promise<boolean> {
  const base = getPublicApiBase();
  if (!base) throw new ApiError(0, "서비스 연결을 확인한 뒤 다시 시도해 주세요.");
  const res = await fetch(`${base}${ACTIVITY_PATH}/remove`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  const json = (await res.json()) as { removed?: boolean };
  return Boolean(json.removed);
}

export async function emitExplorationEvent(input: {
  event_type:
    | "interaction.click"
    | "interaction.comparison"
    | "interaction.bookmark"
    | "interaction.feedback"
    | "interaction.refinement"
    | "interaction.acceptance"
    | "interaction.rejection"
    | "interaction.revisit"
    | "interaction.repeated_view"
    | "interaction.collection_tag"
    | "kpi.time_to_first_result";
  request_id: string;
  session_id?: string;
  scenario_id?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const base = getPublicApiBase();
  if (!base) return;
  const experiments = getOrCreateExperimentAssignments();
  const res = await fetch(`${base}/api/v1/recommendations/events`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      events: [
        {
          ...input,
          metadata: { ...(input.metadata ?? {}), experiments },
        },
      ],
    }),
  });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
}

export function bookmarkPayloadFromBuild(build: RecommendedBuild): {
  build_id: string;
  title: string;
  summary: string;
  components: Record<string, string>;
} {
  return {
    build_id: build.id,
    title: build.title,
    summary: build.tagline,
    components: {
      switches: build.switches,
      plate: build.plate,
      foam: build.foam,
      layout: build.layout,
      ...(build.case ? { case: build.case } : {}),
      ...(build.keycap ? { keycap: build.keycap } : {}),
    },
  };
}

