"""Snapshot tests must match CI image URL resolution (seed CDN, no local mirrors)."""

from __future__ import annotations

import pytest

from keyboard_recommender.config.settings import get_settings


@pytest.fixture(autouse=True)
def _deterministic_image_urls(monkeypatch: pytest.MonkeyPatch, tmp_path) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "swagkey_images_dir", str(tmp_path))
