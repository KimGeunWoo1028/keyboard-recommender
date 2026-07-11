import { describe, expect, it } from "vitest";

import { layoutDiagramCallouts, resolveLayoutDiagramViewBox } from "@/components/features/catalog/layout-diagram/layout-diagram";
import { getLayoutBlueprint, listLayoutBlueprintIds } from "@/components/features/catalog/layout-diagram/layout-diagram-definitions";
import { resolveLayoutDiagramId } from "@/components/features/catalog/layout-diagram/layout-diagram-id";
import type { LayoutKeyDef } from "@/components/features/catalog/layout-diagram/layout-diagram-types";
import { deriveLayoutTraitChips } from "@/components/features/catalog/layout-diagram/layout-trait-chips";

const KEY_UNIT = 11;
const KEY_GAP = 4;
const KEY_HEIGHT = 11;
const PITCH = KEY_UNIT + KEY_GAP;

function keyRect(key: LayoutKeyDef) {
  const h = key.h ?? 1;
  return {
    x: key.x * PITCH,
    y: key.y * PITCH,
    width: key.w * KEY_UNIT + (key.w - 1) * KEY_GAP,
    height: h * KEY_HEIGHT + (h - 1) * KEY_GAP,
  };
}

function overlaps(a: ReturnType<typeof keyRect>, b: ReturnType<typeof keyRect>): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

describe("layout blueprint geometry", () => {
  it("viewBox contains every key", () => {
    for (const id of listLayoutBlueprintIds()) {
      const blueprint = getLayoutBlueprint(id);
      const [, , width, height] = resolveLayoutDiagramViewBox(id).split(" ").map(Number);
      for (const block of blueprint.blocks) {
        for (const key of block.keys) {
          const rect = keyRect(key);
          expect(rect.x + rect.width).toBeLessThanOrEqual(width!);
          expect(rect.y + rect.height).toBeLessThanOrEqual(height!);
        }
      }
    }
  });

  it("has no overlapping keys within each block", () => {
    for (const id of listLayoutBlueprintIds()) {
      const blueprint = getLayoutBlueprint(id);
      for (const block of blueprint.blocks) {
        const rects = block.keys.map(keyRect);
        for (let i = 0; i < rects.length; i += 1) {
          for (let j = i + 1; j < rects.length; j += 1) {
            expect(overlaps(rects[i]!, rects[j]!)).toBe(false);
          }
        }
      }
    }
  });
});

describe("resolveLayoutDiagramId", () => {
  it("maps archetype ids and diagram paths", () => {
    expect(resolveLayoutDiagramId("layout-003")).toBe("tkl");
    expect(resolveLayoutDiagramId(undefined, "/layout-diagrams/tkl.svg")).toBe("tkl");
    expect(resolveLayoutDiagramId("layout-new-001-gdk-lab-dk1-tkl-기판")).toBeNull();
  });
});

describe("deriveLayoutTraitChips", () => {
  it("builds structured chips from layout metadata", () => {
    const chips = deriveLayoutTraitChips({
      layout_size: "80_tkl",
      has_function_row: true,
      has_arrow_cluster: true,
      typing_density: 7,
      is_exploded: false,
    });
    expect(chips.some((c) => c.label.includes("Function row"))).toBe(true);
    expect(chips.some((c) => c.label.includes("방향키"))).toBe(true);
    expect(chips.length).toBeLessThanOrEqual(5);
  });
});

describe("layoutDiagramCallouts", () => {
  it("returns educational callouts per layout", () => {
    const lines = layoutDiagramCallouts("tkl");
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines.some((line) => line.includes("숫자패드"))).toBe(true);
  });
});
