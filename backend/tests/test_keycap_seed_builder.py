"""Keycap metadata derive unit tests (roadmap ⑭)."""

from __future__ import annotations

from keyboard_recommender.catalog.metadata_mapping import derive_keycap_traits
from keyboard_recommender.catalog.swagkey_keycap_seed_builder import (
    CURATED_FULL_CATALOG_IDS,
    build_curated_keycap_seed,
    infer_keycap_metadata,
    validate_keycap_stub,
)


def test_derive_abs_doubleshot_raises_pitch() -> None:
    meta = infer_keycap_metadata("SWG Midnight Rainbow ABS 이중사출 키캡")
    traits = derive_keycap_traits(meta)
    assert traits["high_pitch"] > 5.0
    assert traits["muted"] < 5.0


def test_derive_pbt_dye_sub_raises_muted() -> None:
    meta = infer_keycap_metadata("스웨그키 Calm Beige PBT 염료승화 키캡")
    traits = derive_keycap_traits(meta)
    assert traits["muted"] > 5.0
    assert traits["high_pitch"] < 5.0


def test_bob_65_sets_layout_size() -> None:
    meta = infer_keycap_metadata("스웨그키 Black on Black BoB 키캡 - 65%")
    assert meta.compatible_layout_sizes == ["65"]
    assert validate_keycap_stub(meta) == []


def test_build_curated_keycap_seed_count() -> None:
    import json
    from pathlib import Path

    full = json.loads(
        (Path(__file__).resolve().parents[1] / "data/swagkey_inventory/swagkey_catalog_full.json").read_text(
            encoding="utf-8"
        )
    )
    rows = build_curated_keycap_seed(full["items"])
    assert len(rows) == len(CURATED_FULL_CATALOG_IDS)
    assert all(r["inRecommendationPool"] is True for r in rows)
    assert all("idx=" in r["sourceUrl"] for r in rows)
