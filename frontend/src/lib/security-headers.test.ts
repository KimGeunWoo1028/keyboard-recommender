import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, securityHeaderEntries } from "@/lib/security-headers";

describe("securityHeaderEntries", () => {
  it("includes the six C-SEC-03 baseline headers on HTTPS", () => {
    const keys = securityHeaderEntries({ isHttps: true, allowUnsafeEval: false }).map((h) => h.key);
    expect(keys).toEqual([
      "Content-Security-Policy",
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Strict-Transport-Security",
    ]);
  });

  it("omits HSTS on plain HTTP (local next start)", () => {
    const keys = securityHeaderEntries({ isHttps: false, allowUnsafeEval: false }).map((h) => h.key);
    expect(keys).not.toContain("Strict-Transport-Security");
  });

  it("builds a CSP that blocks framing and plugins", () => {
    const csp = buildContentSecurityPolicy({ allowUnsafeEval: false });
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("allows unsafe-eval only when requested (next dev)", () => {
    const csp = buildContentSecurityPolicy({ allowUnsafeEval: true });
    expect(csp).toContain("'unsafe-eval'");
  });
});
