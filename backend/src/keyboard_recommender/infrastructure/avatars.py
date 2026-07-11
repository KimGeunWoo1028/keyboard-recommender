"""Store and validate user profile avatar uploads."""

from __future__ import annotations

import time
from pathlib import Path

from keyboard_recommender.config.settings import Settings


def avatar_dir(settings: Settings) -> Path:
    path = Path(settings.avatar_upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def detect_image_extension(data: bytes, content_type: str | None = None) -> str | None:
    """Return a safe extension if bytes look like jpeg/png/webp."""
    del content_type  # content-type is untrusted; magic bytes only
    if len(data) < 12:
        return None
    if data.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return "webp"
    return None


def public_avatar_path(user_id: str, ext: str) -> str:
    return f"/media/avatars/{user_id}.{ext}?v={int(time.time())}"


def save_user_avatar(settings: Settings, user_id: str, data: bytes, ext: str) -> str:
    """Write avatar bytes and return the public URL path. Removes older extensions for the same user."""
    directory = avatar_dir(settings)
    for old in directory.glob(f"{user_id}.*"):
        if old.suffix.lstrip(".").lower() != ext:
            try:
                old.unlink()
            except OSError:
                pass
    target = directory / f"{user_id}.{ext}"
    target.write_bytes(data)
    return public_avatar_path(user_id, ext)


def delete_user_avatar_files(settings: Settings, user_id: str) -> None:
    directory = avatar_dir(settings)
    for old in directory.glob(f"{user_id}.*"):
        try:
            old.unlink()
        except OSError:
            pass
