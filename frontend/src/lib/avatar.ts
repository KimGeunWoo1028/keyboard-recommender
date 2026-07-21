import { getPublicApiBase } from "@/lib/api/client";

export const DEFAULT_AVATAR_SRC = "/avatars/default-profile.webp";

/** Resolve a user avatar URL for <img src>. Falls back to the default profile image. */
export function resolveAvatarSrc(avatarUrl?: string | null): string {
  const raw = avatarUrl?.trim();
  if (!raw) return DEFAULT_AVATAR_SRC;
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
    return raw;
  }
  if (raw.startsWith("/")) {
    const base = getPublicApiBase();
    return base ? `${base}${raw}` : raw;
  }
  return DEFAULT_AVATAR_SRC;
}
