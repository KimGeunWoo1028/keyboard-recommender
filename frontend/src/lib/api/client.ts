/**
 * Browser-facing API helpers (NEXT_PUBLIC_* env).
 */

export class ApiError extends Error {
  readonly status: number;

  readonly body?: string;

  constructor(status: number, message: string, body?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Returns base URL without trailing slash, or null if unset. */
export function getPublicApiBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

/**
 * Warn once if the document is HTTPS but the configured API base is HTTP (mixed content / blocked requests).
 * Safe for local dev (HTTP page) and same-origin proxy setups (null base).
 */
export function warnIfHttpsPageCallsHttpApi(): void {
  if (typeof window === "undefined") return;
  const base = getPublicApiBase();
  if (!base) return;
  if (window.location.protocol !== "https:") return;
  try {
    const u = new URL(base);
    if (u.protocol === "http:") {
      console.warn(
        "[Keyboard Recommender] Page is HTTPS but NEXT_PUBLIC_API_URL uses http:. Use an https:// API URL (or same-origin /api proxy) to avoid mixed content.",
      );
    }
  } catch {
    /* ignore invalid base */
  }
}

export async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const parsed = JSON.parse(text) as { detail?: unknown };
    if (typeof parsed.detail === "string") return parsed.detail;
    if (Array.isArray(parsed.detail)) {
      return parsed.detail
        .map((item) => (typeof item === "object" && item !== null ? JSON.stringify(item) : String(item)))
        .join("; ");
    }
  } catch {
    /* not JSON */
  }
  return text || res.statusText;
}
