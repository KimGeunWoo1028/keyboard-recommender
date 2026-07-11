import { describe, expect, it } from "vitest";

import { buildPaginationItems } from "./catalog-pagination";

describe("buildPaginationItems", () => {
  it("returns all pages when total is small", () => {
    expect(buildPaginationItems(2, 3)).toEqual([1, 2, 3]);
  });

  it("collapses distant pages with ellipsis", () => {
    expect(buildPaginationItems(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
  });
});
