import { describe, expect, it } from "vitest";

import { buttonClassName } from "@/components/ui/button";

describe("design-system contrast tokens (DS-F001)", () => {
  it("exposes closed Button variants without transition-all", () => {
    const cls = buttonClassName({ variant: "primary" });
    expect(cls).toContain("bg-primary");
    expect(cls).not.toContain("transition-all");
    expect(cls).toContain("duration-ca-fast");
  });
});

describe("design-system Field export", () => {
  it("Field module loads", async () => {
    const mod = await import("@/components/ui/field");
    expect(typeof mod.Field).toBe("function");
  });
});
