import { describe, expect, it } from "vitest";

import { isAbstractLayoutId, swagkeyProductLinkLabel } from "@/lib/layout-catalog-links";

describe("layout catalog link labels", () => {
  it("uses representative kit copy for abstract layout ids", () => {
    expect(swagkeyProductLinkLabel("layout", "layout-002")).toBe("이 배열의 대표 키트 보기");
    expect(isAbstractLayoutId("layout-007")).toBe(true);
  });

  it("keeps default copy for kit-named layouts and other domains", () => {
    expect(swagkeyProductLinkLabel("layout", "layout-new-004-neo65-cu-기판")).toBe("스웨그키에서 보기");
    expect(swagkeyProductLinkLabel("switch", "layout-001")).toBe("스웨그키에서 보기");
  });
});
