"""Tests for seed-backed part image URL resolution."""

from __future__ import annotations

from pathlib import Path

from keyboard_recommender.catalog.catalog_seed_images import resolve_part_image_url, resolve_seed_row_image_url
from keyboard_recommender.config.settings import get_settings
from keyboard_recommender.trait_engine.api_envelope import build_recommendation_result
from tests.support.regression import STABLE_SURVEY


def test_resolve_part_image_url_layout_archetype_uses_diagram() -> None:
    assert resolve_part_image_url("layout", "layout-001") == "/layout-diagrams/60-standard.svg"
    assert resolve_part_image_url("layout", "layout-003") == "/layout-diagrams/tkl.svg"


def test_resolve_part_image_url_layout_product_has_mirror_or_cdn() -> None:
    url = resolve_part_image_url("layout", "layout-new-001-gdk-lab-dk1-tkl-기판")
    assert url.startswith("/media/swagkey-images/") or url.startswith("https://cdn.imweb.me/thumbnail/")


def test_resolve_part_image_url_switch_has_mirror_or_cdn() -> None:
    url = resolve_part_image_url("switch", "sw-linear-001")
    assert url.startswith("/media/swagkey-images/") or url.startswith("https://cdn.imweb.me/thumbnail/")


def test_resolve_part_image_url_uses_local_mirror_when_present(monkeypatch, tmp_path: Path) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "swagkey_images_dir", str(tmp_path))
    (tmp_path / "1792.jpg").write_bytes(b"\xff\xd8\xff\xe0" + b"\x00" * 64)
    assert resolve_part_image_url("switch", "sw-linear-001") == "/media/swagkey-images/1792.jpg"


def test_build_recommendation_result_includes_image_url() -> None:
    payload = build_recommendation_result(dict(STABLE_SURVEY))
    for pick in payload["recommendations"]:
        assert "imageUrl" in pick
        assert isinstance(pick["imageUrl"], str)
        if pick["domain"] == "layout":
            assert pick["imageUrl"]
            assert pick["imageUrl"].startswith("/media/swagkey-images/") or pick["imageUrl"].startswith(
                "https://cdn.imweb.me/thumbnail/"
            )
        for alt in pick.get("alternatives") or []:
            assert "imageUrl" in alt
            assert isinstance(alt["imageUrl"], str)

    switch_pick = next(p for p in payload["recommendations"] if p["domain"] == "switch")
    assert switch_pick["imageUrl"] == resolve_part_image_url("switch", switch_pick["itemId"])


def test_resolve_seed_row_image_url_empty_row() -> None:
    assert resolve_seed_row_image_url({}) == ""
