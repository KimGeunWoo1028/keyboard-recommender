import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const frontendRoot = join(__dirname, "../..");

describe("Phase 4 Home Landing gate", () => {
  it("home page is Hero + FeatureGrid only (no WorkshopStrip)", () => {
    const page = readFileSync(join(frontendRoot, "src/app/page.tsx"), "utf8");
    expect(page).toContain("HomeHero");
    expect(page).toContain("FeatureGrid");
    expect(page).toContain("HomeLandingObserve");
    expect(page).not.toMatch(/WorkshopStrip/);
    expect(page).not.toMatch(/Dashboard/);
    expect(page).not.toMatch(/TrendingBuilds/);
  });

  it("WorkshopStrip source file stays deleted", () => {
    expect(existsSync(join(frontendRoot, "src/components/features/home/workshop-strip.tsx"))).toBe(false);
  });
});
