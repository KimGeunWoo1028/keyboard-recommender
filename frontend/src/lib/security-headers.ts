/**
 * Baseline browser security headers for Next responses (C-SEC-03).
 * CSP is intentionally pragmatic for App Router + Tailwind inline CSS + next-themes:
 * style/script allow 'unsafe-inline' until a nonce pipeline is wired end-to-end.
 *
 * ``next dev`` (Playwright start-stack) needs ``'unsafe-eval'`` for React Refresh /
 * webpack. Production ``next start`` keeps eval blocked.
 */

function apiOriginsForConnectSrc(): string[] {
  const origins = new Set<string>([
    "http://localhost:8010",
    "http://127.0.0.1:8010",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
  ]);
  for (const raw of [process.env.NEXT_PUBLIC_API_URL, process.env.INTERNAL_API_PROXY_TARGET]) {
    const trimmed = raw?.trim();
    if (!trimmed) continue;
    try {
      origins.add(new URL(trimmed).origin);
    } catch {
      /* ignore invalid */
    }
  }
  return [...origins];
}

export function buildContentSecurityPolicy(options?: {
  upgradeInsecureRequests?: boolean;
  allowUnsafeEval?: boolean;
}): string {
  const scriptSrc = options?.allowUnsafeEval
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";
  const connect = ["'self'", ...apiOriginsForConnectSrc(), "https:"].join(" ");
  const directives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data:",
    `connect-src ${connect}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ];
  if (options?.upgradeInsecureRequests) {
    directives.push("upgrade-insecure-requests");
  }
  return directives.join("; ");
}

export function securityHeaderEntries(options?: {
  isHttps?: boolean;
  /** Default: true when ``NODE_ENV !== 'production'`` (next dev / E2E). */
  allowUnsafeEval?: boolean;
}): Array<{ key: string; value: string }> {
  const isHttps = Boolean(options?.isHttps);
  const allowUnsafeEval =
    options?.allowUnsafeEval ?? process.env.NODE_ENV !== "production";
  const headers: Array<{ key: string; value: string }> = [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy({
        upgradeInsecureRequests: isHttps,
        allowUnsafeEval,
      }),
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
  ];
  if (isHttps) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }
  return headers;
}

export function applySecurityHeaders(
  response: { headers: { set: (key: string, value: string) => void } },
  options?: { isHttps?: boolean; allowUnsafeEval?: boolean },
): void {
  for (const { key, value } of securityHeaderEntries(options)) {
    response.headers.set(key, value);
  }
}
