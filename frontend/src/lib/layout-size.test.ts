import { describe, expect, it } from "vitest";

import { layoutSizeFilterLabel, layoutSizeShortLabel, normalizeLayoutSizes } from "@/lib/layout-size";

describe("layout-size helpers", () => {
  it("formats short and filter labels", () => {
    expect(layoutSizeShortLabel("80_tkl")).toBe("TKL");
    expect(layoutSizeFilterLabel("65")).toBe("65% 배열");
  });

  it("normalizes primary and compatible sizes", () => {
    expect(normalizeLayoutSizes("65", ["75", "65"])).toEqual(["65", "75"]);
  });
});
