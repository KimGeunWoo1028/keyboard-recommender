"""Best-effort Swagkey thumbnail mirror on staging/production cold start."""

from __future__ import annotations

import json
import logging
import threading
from pathlib import Path

from keyboard_recommender.catalog.swagkey_image_mirror import mirror_seed_images
from keyboard_recommender.config.settings import Settings
from keyboard_recommender.infrastructure.swagkey_images import swagkey_images_dir

logger = logging.getLogger(__name__)

_MIN_LOCAL_FILES = 50


def local_swagkey_image_count(images_dir: Path) -> int:
    return sum(1 for f in images_dir.iterdir() if f.is_file() and f.name != ".gitkeep")


def _default_seed_path(images_dir: Path) -> Path:
    backend_root = images_dir.parent.parent
    return backend_root / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json"


def _run_mirror(settings: Settings) -> None:
    images_dir = swagkey_images_dir(settings)
    seed_path = _default_seed_path(images_dir)
    if not seed_path.is_file():
        logger.warning("swagkey_startup_mirror_missing_seed path=%s", seed_path)
        return
    try:
        payload = json.loads(seed_path.read_text(encoding="utf-8"))
        report = mirror_seed_images(
            payload,
            images_dir,
            seed_in=str(seed_path).replace("\\", "/"),
            force=False,
            dry_run=False,
            sleep_ms=150,
            timeout_s=30.0,
        )
        logger.info(
            "swagkey_startup_mirror_done downloaded=%s skipped=%s failed=%s total=%s dir=%s",
            report.downloaded,
            report.skipped_existing,
            report.failed,
            local_swagkey_image_count(images_dir),
            images_dir,
        )
    except Exception:
        logger.exception("swagkey_startup_mirror_failed")


def start_swagkey_mirror_if_needed(settings: Settings) -> None:
    """Mirror seed CDN thumbnails when the local directory is still mostly empty."""
    if settings.app_environment not in ("staging", "production"):
        return
    images_dir = swagkey_images_dir(settings)
    existing = local_swagkey_image_count(images_dir)
    if existing >= _MIN_LOCAL_FILES:
        return
    logger.info("swagkey_startup_mirror_begin dir=%s existing=%s", images_dir, existing)
    thread = threading.Thread(
        target=_run_mirror,
        args=(settings,),
        name="swagkey-mirror",
        daemon=True,
    )
    thread.start()
