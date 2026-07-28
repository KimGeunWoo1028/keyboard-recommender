/**
 * Non-PII share payload for SHR-01 public landing.
 * Never include email, user id, or raw survey answers beyond taste labels.
 */

export type ShareTastePayload = {
  v: 1;
  title: string;
  tags: string[];
  why?: string;
};

export function encodeShareTaste(payload: ShareTastePayload): string {
  const json = JSON.stringify(payload);
  if (typeof window === "undefined") {
    return Buffer.from(json, "utf8").toString("base64url");
  }
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShareTaste(token: string): ShareTastePayload | null {
  try {
    const padded = token.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (padded.length % 4)) % 4;
    const b64 = padded + "=".repeat(padLen);
    let json: string;
    if (typeof window === "undefined") {
      json = Buffer.from(b64, "base64").toString("utf8");
    } else {
      const binary = atob(b64);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      json = new TextDecoder().decode(bytes);
    }
    const parsed = JSON.parse(json) as ShareTastePayload;
    if (parsed.v !== 1 || typeof parsed.title !== "string" || !Array.isArray(parsed.tags)) {
      return null;
    }
    return {
      v: 1,
      title: parsed.title.slice(0, 120),
      tags: parsed.tags.filter((t) => typeof t === "string").slice(0, 6),
      why: typeof parsed.why === "string" ? parsed.why.slice(0, 200) : undefined,
    };
  } catch {
    return null;
  }
}

export function buildShareUrl(origin: string, payload: ShareTastePayload): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/share?t=${encodeShareTaste(payload)}`;
}
