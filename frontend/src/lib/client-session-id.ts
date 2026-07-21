const STORAGE_KEY = "kr_session_id";

/** Stable anonymous session id for analytics / experiments (localStorage). */
export function getOrCreateClientSessionId(): string {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(STORAGE_KEY)?.trim();
  if (existing) return existing;
  const created = globalThis.crypto?.randomUUID?.() ?? `sess-${Date.now()}`;
  window.localStorage.setItem(STORAGE_KEY, created);
  return created;
}
