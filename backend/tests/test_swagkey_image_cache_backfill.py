from __future__ import annotations

import json
from pathlib import Path

from keyboard_recommender.catalog.swagkey_image_cache_backfill import (
    default_cache_roots,
    discover_cache_html_files,
    extract_images_from_cache_files,
    infer_seed_id_from_filename,
    load_seed_payload,
    write_cache_backfill_report,
)

_REPO_ROOT = Path(__file__).resolve().parents[2]
_BACKEND = _REPO_ROOT / "backend"
_DATA = _BACKEND / "data"
_SEED = _BACKEND / "src/keyboard_recommender/catalog/swagkey_products.seed.json"


def test_infer_seed_id_from_filename() -> None:
    assert infer_seed_id_from_filename(Path("sw-linear-001.html")) == "sw-linear-001"
    assert infer_seed_id_from_filename(Path("sw-new-012-foo.html")) == "sw-new-012"
    assert infer_seed_id_from_filename(Path("plate-new-003-mm.html")) == "plate-new-003"
    assert infer_seed_id_from_filename(Path("foam-001.html")) == "foam-001"


def test_discover_cache_html_files_includes_repo_caches() -> None:
    roots = default_cache_roots(_DATA)
    files = discover_cache_html_files(roots)
    assert len(files) >= 90
    assert any(p.name == "foam-001.html" for p in files)
    assert any("sw-new-001" in p.name for p in files)


def test_extract_images_from_cache_files_repo_backfill() -> None:
    cache_files = discover_cache_html_files(default_cache_roots(_DATA))
    report = extract_images_from_cache_files(
        cache_files,
        seed_payload=load_seed_payload(_SEED),
        repo_root=_REPO_ROOT,
    )

    assert report.stats["filesScanned"] == len(cache_files)
    assert report.stats["resolved"] >= 30
    assert report.stats["fromCache"] == report.stats["resolved"]
    assert report.stats["failed"] >= 50
    assert report.stats["resolvedFiles"] + report.stats["failed"] == report.stats["filesScanned"]

    product_ids = {item.swagkey_product_id for item in report.items}
    assert "1303" in product_ids
    assert "253" in product_ids

    foam_item = next(item for item in report.items if item.swagkey_product_id == "253")
    assert foam_item.image_url.startswith("https://cdn.imweb.me/thumbnail/")
    assert foam_item.match_method == "page_idx"
    assert "foam-001" in foam_item.seed_ids

    legacy_failures = [f for f in report.failures if f.reason == "legacy_category_cache"]
    assert len(legacy_failures) >= 50


def test_write_cache_backfill_report_roundtrip(tmp_path: Path) -> None:
    foam_cache = _DATA / "swagkey_html_cache/foams/foam-001.html"
    report = extract_images_from_cache_files([foam_cache], seed_payload=load_seed_payload(_SEED), repo_root=_REPO_ROOT)
    out_path = tmp_path / "swagkey_product_images.json"
    write_cache_backfill_report(report, out_path)
    payload = json.loads(out_path.read_text(encoding="utf-8"))
    assert payload["schemaVersion"] == "1.0.0"
    assert payload["stats"]["resolved"] == 1
    assert payload["items"][0]["swagkeyProductId"] == "253"
    assert payload["items"][0]["imageUrl"].startswith("https://cdn.imweb.me/thumbnail/")
