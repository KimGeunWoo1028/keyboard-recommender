import type { Page } from "@playwright/test";

/** Minimal catalog list payload for visual / offline captures. */
export const CATALOG_VISUAL_FIXTURE = {
  family: "switch",
  items: [
    {
      id: "switch-visual-001",
      name: "Visual QA Switch Alpha",
      description: "Deterministic fixture for screenshot capture.",
      family: "switch",
      subtype: "linear",
      sourceUrl: "https://example.com/switch-alpha",
      imageUrl: "",
      popularityWeight: 1,
    },
    {
      id: "switch-visual-002",
      name: "Visual QA Switch Beta",
      description: "Second fixture row.",
      family: "switch",
      subtype: "tactile",
      sourceUrl: "https://example.com/switch-beta",
      imageUrl: "",
      popularityWeight: 0.8,
    },
    {
      id: "switch-visual-003",
      name: "Visual QA Switch Gamma",
      description: "Third fixture row.",
      family: "switch",
      subtype: "clicky",
      sourceUrl: "https://example.com/switch-gamma",
      imageUrl: "",
      popularityWeight: 0.6,
    },
    {
      id: "switch-visual-004",
      name: "Visual QA Switch Delta",
      description: "Fourth fixture row.",
      family: "switch",
      subtype: "linear",
      sourceUrl: "https://example.com/switch-delta",
      imageUrl: "",
      popularityWeight: 0.4,
    },
  ],
  total: 4,
  limit: 24,
  offset: 0,
  subtype: null,
  layoutSize: null,
};

const FAMILY_PATH: Record<string, string> = {
  switches: "switch",
  plates: "plate",
  foam: "foam",
  layouts: "layout",
  cases: "case",
  keycaps: "keycap",
};

/**
 * Intercept catalog list API so visual captures are not stuck on skeletons
 * when the backend is down (Visual QA V-DET-06 / V-F001).
 */
export async function installCatalogListFixture(page: Page): Promise<void> {
  await page.route(/\/api\/v1\/(switches|plates|foam|layouts|cases|keycaps)(\/|\?|$)/, async (route) => {
    const url = new URL(route.request().url());
    const parts = url.pathname.split("/").filter(Boolean);
    const resource = parts[2] ?? "switches";
    const family = FAMILY_PATH[resource] ?? "switch";
    const isDetail = parts.length >= 4;
    if (isDetail) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ detail: "fixture: no detail" }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...CATALOG_VISUAL_FIXTURE,
        family,
        items: CATALOG_VISUAL_FIXTURE.items.map((item) => ({ ...item, family })),
      }),
    });
  });
}
