from __future__ import annotations

import json
from pathlib import Path

from keyboard_recommender.catalog.browse_image_coverage import audit_browse_image_coverage


def test_browse_image_coverage_report_shape() -> None:
    seed_path = (
        Path(__file__).resolve().parents[1]
        / "src"
        / "keyboard_recommender"
        / "catalog"
        / "swagkey_products.seed.json"
    )
    if not seed_path.is_file():
        return
    payload = json.loads(seed_path.read_text(encoding="utf-8"))
    report = audit_browse_image_coverage(payload, min_coverage_pct=85.0)
    assert report.families
    for family in ("switch", "plate", "foam", "case", "keycap"):
        bucket = report.families[family]
        assert bucket.browse_listable >= 0
        assert bucket.with_image + bucket.without_image == bucket.browse_listable
