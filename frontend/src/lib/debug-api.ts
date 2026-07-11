/**
 * Browser calls to the gated FastAPI ``/api/v1/debug`` routes.
 * Token is read from ``sessionStorage`` key ``internalDebugToken`` when set.
 */

export function getDebugApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
}

export function internalDebugFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const base = getDebugApiBaseUrl();
  const headers = new Headers(init.headers);
  if (typeof window !== "undefined") {
    const token = window.sessionStorage.getItem("internalDebugToken")?.trim();
    if (token) {
      headers.set("X-Internal-Debug-Token", token);
    }
  }
  const p = path.startsWith("/") ? path : `/${path}`;
  /** Same-origin only works if you proxy ``/api`` to the FastAPI server (or use ``NEXT_PUBLIC_API_URL``). */
  const url = base ? `${base}/api/v1/debug${p}` : `/api/v1/debug${p}`;
  return fetch(url, { ...init, headers, cache: "no-store" });
}
