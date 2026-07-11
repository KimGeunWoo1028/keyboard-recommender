from __future__ import annotations

import json
from pathlib import Path

from keyboard_recommender.catalog.swagkey_image_merge import (
    build_image_lookup,
    load_product_images_artifact,
    merge_images_into_inventory,
    merge_images_into_seed,
    write_json,
)

_REPO_ROOT = Path(__file__).resolve().parents[2]
_BACKEND = _REPO_ROOT / "backend"
_DATA = _BACKEND / "data" / "swagkey_inventory"
_INVENTORY_V2 = _DATA / "swagkey_inventory.v2.json"
_IMAGES = _DATA / "swagkey_product_images.json"
_SEED = _BACKEND / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json"


def test_merge_images_into_inventory_adds_image_url(tmp_path: Path) -> None:
    inventory = json.loads(_INVENTORY_V2.read_text(encoding="utf-8"))
    lookup = build_image_lookup(load_product_images_artifact(_IMAGES))
    merged, report = merge_images_into_inventory(inventory, lookup)
    assert report.with_image >= 280
    first_with_image = next(
        item for item in merged["items"] if str(item.get("imageUrl") or "").startswith("https://cdn.imweb.me/thumbnail/")
    )
    assert first_with_image["swagkeyProductId"]
    out = tmp_path / "inventory.v3.json"
    write_json(out, merged)
    payload = json.loads(out.read_text(encoding="utf-8"))
    assert payload["schemaVersion"] == "1.1.0"


def test_merge_images_into_seed_by_product_id() -> None:
    seed = json.loads(_SEED.read_text(encoding="utf-8"))
    lookup = build_image_lookup(load_product_images_artifact(_IMAGES))
    merged, report = merge_images_into_seed(seed, lookup, inventory_items=[])
    assert report.seed_total >= 300
    assert report.with_image >= 200
    assert report.fill_rate_pct >= 60.0
    assert report.by_method.get("product_id", 0) >= 150
    assert report.by_method.get("fuzzy_name", 0) in (0, None)

    row = next(r for r in report.rows if r.seed_id == "sw-linear-001")
    assert row.match_method == "product_id"
    assert row.image_url.startswith("https://cdn.imweb.me/thumbnail/")

    flat_switch = None
    for subtype_rows in merged["switches"].values():
        for item in subtype_rows:
            if item.get("id") == "sw-linear-001":
                flat_switch = item
    assert flat_switch is not None
    assert flat_switch["imageUrl"] == row.image_url


def test_merge_images_into_seed_never_uses_fuzzy_name() -> None:
    seed = json.loads(_SEED.read_text(encoding="utf-8"))
    lookup = build_image_lookup(load_product_images_artifact(_IMAGES))
    _merged, report = merge_images_into_seed(seed, lookup, inventory_items=[])
    assert report.by_method.get("fuzzy_name", 0) == 0
    gateron = next(r for r in report.rows if r.seed_id == "sw-linear-006")
    assert gateron.match_method in ("missing", "product_id")
    if gateron.image_url:
        assert gateron.matched_product_id == "1668"


def test_merge_images_into_seed_missing_keeps_empty() -> None:
    seed = {
        "switches": {"linear": [{"id": "sw-test", "name": "No Image Switch", "sourceUrl": "https://www.swagkey.kr/shop_view/?idx=99999999"}]},
        "plates": [],
        "foams": [],
        "layouts": [],
        "cases": [],
        "keycaps": [],
    }
    merged, report = merge_images_into_seed(seed, {}, inventory_items=[])
    assert report.with_image == 0
    assert merged["switches"]["linear"][0].get("imageUrl") is None
