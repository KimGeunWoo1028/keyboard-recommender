import { describe, expect, it } from "vitest";

import {
  bookmarkActivityFromSaved,
  mergeBookmarkActivity,
  mergeSavedBookmarkLists,
  type RecommendationActivityItem,
  type SavedRecommendationItem,
} from "@/lib/api/saved-recommendations";

function saved(overrides: Partial<SavedRecommendationItem> = {}): SavedRecommendationItem {
  return {
    saved_at: "2026-07-09T12:00:00.000Z",
    request_id: "req-1",
    build_id: "build-1",
    title: "Test build",
    summary: "Tag",
    components: { switches: "Switch A" },
    metadata: { collection: "일반", note: "메모" },
    ...overrides,
  };
}

describe("saved bookmark activity merge", () => {
  it("maps saved items to bookmark activity rows", () => {
    const row = bookmarkActivityFromSaved(saved());
    expect(row.event_type).toBe("interaction.bookmark");
    expect(row.metadata.buildId).toBe("build-1");
    expect(row.metadata.title).toBe("Test build");
    expect(row.metadata.note).toBe("메모");
  });

  it("fills recent activity from local saved items when server activity is empty", () => {
    const merged = mergeBookmarkActivity([], [saved()]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.metadata.title).toBe("Test build");
  });

  it("dedupes server bookmark rows against saved items", () => {
    const fromServer: RecommendationActivityItem[] = [
      {
        occurred_at: "2026-07-09T12:00:00.000Z",
        event_type: "interaction.bookmark",
        request_id: "req-1",
        metadata: { buildId: "build-1", title: "Test build" },
      },
    ];
    const merged = mergeBookmarkActivity(fromServer, [saved()]);
    expect(merged).toHaveLength(1);
  });

  it("merges remote and local saved bookmark lists", () => {
    const remote = [saved({ request_id: "req-remote", build_id: "build-remote" })];
    const local = [saved({ request_id: "req-local", build_id: "build-local" })];
    const merged = mergeSavedBookmarkLists(remote, local);
    expect(merged).toHaveLength(2);
  });
});
