import { describe, expect, it } from "vitest";

import type { SavedRecommendationItem } from "@/lib/api/saved-recommendations";

import { buildStackParts, savedItemKey, splitComponentText } from "./mypage-build-stack";

function item(partial: Partial<SavedRecommendationItem> = {}): SavedRecommendationItem {
  return {
    saved_at: "2026-07-01T00:00:00.000Z",
    request_id: "req-1",
    build_id: "build-1",
    title: "추천 조합: Quiet · Soft (Thocky)",
    summary: "summary",
    components: {},
    metadata: {},
    ...partial,
  };
}

describe("mypage-build-stack", () => {
  it("splits component text on em dash or hyphen", () => {
    expect(splitComponentText("Gateron Oil King — factory lubed")).toEqual({
      name: "Gateron Oil King",
      detail: "factory lubed",
    });
    expect(splitComponentText("FR4 - stiff")).toEqual({ name: "FR4", detail: "stiff" });
    expect(splitComponentText("Plain name")).toEqual({ name: "Plain name" });
  });

  it("builds ordered stack parts from known component keys", () => {
    const parts = buildStackParts(
      item({
        components: {
          switches: "Switch A — quiet",
          plate: "FR4",
          foam: "Poron",
          layout: "65%",
          case: "Aluminum",
          keycap: "PBT",
        },
      }),
    );
    expect(parts.map((p) => p.label)).toEqual(["스위치", "플레이트", "폼", "레이아웃", "케이스", "키캡"]);
    expect(parts[0]).toMatchObject({ name: "Switch A", detail: "quiet" });
  });

  it("accepts switch alias key", () => {
    const parts = buildStackParts(item({ components: { switch: "Linear X" } }));
    expect(parts).toEqual([{ key: "switches", label: "스위치", name: "Linear X" }]);
  });

  it("builds stable saved item keys", () => {
    const row = item({ request_id: "r", build_id: "b", saved_at: "t" });
    expect(savedItemKey(row)).toBe("r:b:t");
  });
});
