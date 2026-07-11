import "server-only";

/**
 * Server-only: token for ``/api/v1/debug`` from ``INTERNAL_DEBUG_TOKEN`` in Next.js env.
 * Never use ``NEXT_PUBLIC_*`` for this value — it must not ship in the browser bundle.
 */
export function getServerInternalDebugToken(): string | undefined {
  const raw = process.env.INTERNAL_DEBUG_TOKEN;
  const t = typeof raw === "string" ? raw.trim() : "";
  return t.length > 0 ? t : undefined;
}
