import type { SurveySubmission } from "@/types/survey";

const SNAPSHOTS_KEY = "kr_saved_result_snapshots_v1";

export type SavedResultSnapshot = {
  id: string;
  savedAt: string;
  submission: SurveySubmission;
};

function readAll(): Record<string, SavedResultSnapshot> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SNAPSHOTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SavedResultSnapshot>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, SavedResultSnapshot>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(map));
}

export function makeResultSnapshotId(requestId: string, buildId: string): string {
  return `${requestId}:${buildId}`;
}

export function saveResultSnapshot(id: string, submission: SurveySubmission): void {
  if (typeof window === "undefined") return;
  const map = readAll();
  map[id] = {
    id,
    savedAt: new Date().toISOString(),
    submission,
  };
  // Keep newest 40 snapshots to bound localStorage growth.
  const entries = Object.values(map).sort((a, b) => +new Date(b.savedAt) - +new Date(a.savedAt));
  const next: Record<string, SavedResultSnapshot> = {};
  for (const entry of entries.slice(0, 40)) next[entry.id] = entry;
  writeAll(next);
}

export function loadResultSnapshot(id: string): SurveySubmission | null {
  const entry = readAll()[id];
  if (!entry?.submission) return null;
  const sub = entry.submission;
  if (sub.version !== 2 || !sub.answers || !sub.traits) return null;
  return sub;
}

export function removeResultSnapshot(id: string): void {
  const map = readAll();
  if (!(id in map)) return;
  delete map[id];
  writeAll(map);
}
