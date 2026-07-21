import { describe, expect, it } from "vitest";

import {
  parseCatalogListResponse,
  parseCatalogPartDetail,
  resolveCatalogImageUrl,
  shouldSkipCatalogImageOptimization,
} from "@/lib/api/catalog";
import { catalogHref } from "@/lib/catalog-links";

describe("catalog API contract", () => {
  it("parses list payload with camelCase keys", () => {
    const out = parseCatalogListResponse({
      family: "switch",
      items: [
        {
          id: "sw-1",
          name: "Test Switch",
          description: "desc",
          family: "switch",
          subtype: "linear",
          sourceUrl: "https://www.swagkey.kr/21/?idx=1",
          imageUrl: "https://cdn.imweb.me/thumbnail/20260507/f4d4a59fbeb2b.jpg",
          popularityWeight: 1,
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
      subtype: null,
    });
    expect(out.total).toBe(1);
    expect(out.items[0]?.sourceUrl).toContain("swagkey");
    expect(out.items[0]?.imageUrl).toContain("cdn.imweb.me/thumbnail/");
  });

  it("defaults imageUrl to empty string when missing", () => {
    const out = parseCatalogListResponse({
      family: "switch",
      items: [
        {
          id: "sw-no-image",
          name: "No Image",
          description: "",
          family: "switch",
          subtype: "linear",
          sourceUrl: "",
          popularityWeight: 1,
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
      subtype: null,
    });
    expect(out.items[0]?.imageUrl).toBe("");
  });

  it("parses detail payload", () => {
    const out = parseCatalogPartDetail({
      id: "plate-001",
      name: "Plate",
      description: "",
      family: "plate",
      subtype: "plate",
      sourceUrl: "",
      imageUrl: "",
      popularityWeight: 1,
      traits: { smooth: 5 },
      metadata: { material: "FR4" },
    });
    expect(out.metadata.material).toBe("FR4");
    expect(out.traits.smooth).toBe(5);
  });

  it("parses keycap family", () => {
    const out = parseCatalogListResponse({
      family: "keycap",
      items: [
        {
          id: "kc-001",
          name: "Test Keycap",
          description: "",
          family: "keycap",
          subtype: "base",
          sourceUrl: "https://www.swagkey.kr/shop_view/?idx=1",
          imageUrl: "",
          popularityWeight: 1,
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
      subtype: null,
    });
    expect(out.family).toBe("keycap");
    expect(out.items[0]?.id).toBe("kc-001");
  });

  it("parses layout family", () => {
    const out = parseCatalogListResponse({
      family: "layout",
      items: [
        {
          id: "layout-001",
          name: "60% Standard",
          description: "",
          family: "layout",
          subtype: "layout",
          sourceUrl: "https://www.swagkey.kr/shop_view/?idx=1504",
          imageUrl: "https://cdn.imweb.me/thumbnail/20260507/example.jpg",
          popularityWeight: 1,
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
      subtype: null,
    });
    expect(out.family).toBe("layout");
    expect(out.items[0]?.id).toBe("layout-001");
  });

  it("builds catalog deep links", () => {
    expect(catalogHref({ family: "switch", subtype: "linear" })).toBe(
      "/catalog?family=switch&subtype=linear",
    );
    expect(catalogHref({ family: "keycap", q: "gmk" })).toBe("/catalog?family=keycap&q=gmk");
    expect(catalogHref({ family: "case", layoutSize: "65" })).toBe("/catalog?family=case&layoutSize=65");
  });

  it("parses case layout tags on list items", () => {
    const out = parseCatalogListResponse({
      family: "case",
      items: [
        {
          id: "case-001",
          name: "NEO65",
          description: "",
          family: "case",
          subtype: "kit",
          sourceUrl: "",
          imageUrl: "",
          popularityWeight: 1,
          layoutSize: "65",
          compatibleLayoutSizes: ["65"],
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
      subtype: null,
      layoutSize: "65",
    });
    expect(out.items[0]?.layoutSize).toBe("65");
    expect(out.items[0]?.compatibleLayoutSizes).toEqual(["65"]);
    expect(out.layoutSize).toBe("65");
  });

  it("resolves API-relative mirror image paths with NEXT_PUBLIC_API_URL", () => {
    const prev = process.env.NEXT_PUBLIC_API_URL;
    const prevProxy = process.env.INTERNAL_API_PROXY_TARGET;
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8010";
    delete process.env.INTERNAL_API_PROXY_TARGET;
    expect(resolveCatalogImageUrl("/media/swagkey-images/1792.jpg")).toBe(
      "http://localhost:8010/media/swagkey-images/1792.jpg",
    );
    expect(resolveCatalogImageUrl("https://cdn.imweb.me/thumbnail/x.jpg")).toBe(
      "https://cdn.imweb.me/thumbnail/x.jpg",
    );
    expect(resolveCatalogImageUrl("/layout-diagrams/tkl.svg")).toBe("/layout-diagrams/tkl.svg");
    process.env.NEXT_PUBLIC_API_URL = prev;
    if (prevProxy === undefined) delete process.env.INTERNAL_API_PROXY_TARGET;
    else process.env.INTERNAL_API_PROXY_TARGET = prevProxy;
  });

  it("uses absolute /media URL in the browser when API origin differs from the page", () => {
    const prev = process.env.NEXT_PUBLIC_API_URL;
    const prevProxy = process.env.INTERNAL_API_PROXY_TARGET;
    process.env.NEXT_PUBLIC_API_URL = "https://www.example.com";
    process.env.INTERNAL_API_PROXY_TARGET = "https://api.example.com";
    // jsdom page origin is not www.example.com → absolute API URL for <img>.
    expect(resolveCatalogImageUrl("/media/swagkey-images/1792.jpg")).toBe(
      "https://www.example.com/media/swagkey-images/1792.jpg",
    );
    process.env.NEXT_PUBLIC_API_URL = prev;
    if (prevProxy === undefined) delete process.env.INTERNAL_API_PROXY_TARGET;
    else process.env.INTERNAL_API_PROXY_TARGET = prevProxy;
  });

  it("skips optimization only for unknown remote hosts", () => {
    expect(shouldSkipCatalogImageOptimization("/media/swagkey-images/1.jpg")).toBe(false);
    expect(shouldSkipCatalogImageOptimization("https://cdn.imweb.me/thumbnail/x.jpg")).toBe(false);
    expect(shouldSkipCatalogImageOptimization("https://evil.example/x.jpg")).toBe(true);
  });
});
