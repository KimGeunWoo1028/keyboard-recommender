"""Local Swagkey product thumbnail storage and public URL helpers."""

from __future__ import annotations

from pathlib import Path

from keyboard_recommender.catalog.swagkey_crawler_v2 import extract_product_id_from_url
from keyboard_recommender.config.settings import Settings

MEDIA_MOUNT_PATH = "/media/swagkey-images"
ALLOWED_IMAGE_EXTENSIONS = ("webp", "jpg", "jpeg", "png")


def swagkey_images_dir(settings: Settings) -> Path:
    path = Path(settings.swagkey_images_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def find_local_image(idx: str, directory: Path) -> Path | None:
    """Return the on-disk mirror file for a Swagkey product idx, if present."""
    needle = str(idx or "").strip()
    if not needle:
        return None
    for ext in ALLOWED_IMAGE_EXTENSIONS:
        candidate = directory / f"{needle}.{ext}"
        if candidate.is_file() and candidate.stat().st_size > 0:
            return candidate
    return None


def public_swagkey_image_path(idx: str, ext: str) -> str:
    safe_ext = ext.lstrip(".").lower()
    return f"{MEDIA_MOUNT_PATH}/{idx}.{safe_ext}"


def resolve_served_image_url(cdn_url: str, source_url: str, images_dir: Path) -> str:
    """Prefer a local mirror path when the file exists; otherwise keep the CDN URL."""
    cdn = str(cdn_url or "").strip()
    idx = extract_product_id_from_url(str(source_url or "").strip())
    if not idx:
        return cdn
    local = find_local_image(idx, images_dir)
    if local is None:
        return cdn
    ext = local.suffix.lstrip(".").lower()
    return public_swagkey_image_path(idx, ext)
