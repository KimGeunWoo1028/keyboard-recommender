import type { Page } from "@playwright/test";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

/**
 * Remove all account bookmarks for the current browser context (shared e2e-ci user).
 * Uses Playwright request (context cookies) so it works before any page navigation.
 */
export async function clearExistingSavedBuilds(page: Page): Promise<number> {
  console.log("saved:clear:start");
  const listResponse = await page.request.get(`${API_BASE}/api/v1/recommendations/saved?limit=100`, {
    headers: { Accept: "application/json" },
  });
  if (!listResponse.ok()) {
    throw new Error(`list saved failed: ${listResponse.status()}`);
  }
  const json = (await listResponse.json()) as {
    items?: Array<{ request_id: string; build_id: string; saved_at?: string }>;
  };
  const items = Array.isArray(json.items) ? json.items : [];

  for (const item of items) {
    const removeResponse = await page.request.post(`${API_BASE}/api/v1/recommendations/saved/remove`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: {
        request_id: item.request_id,
        build_id: item.build_id,
        ...(item.saved_at ? { saved_at: item.saved_at } : {}),
      },
    });
    if (!removeResponse.ok()) {
      throw new Error(`remove saved failed: ${removeResponse.status()}`);
    }
  }
  console.log(`saved:clear:done:${items.length}`);
  return items.length;
}
