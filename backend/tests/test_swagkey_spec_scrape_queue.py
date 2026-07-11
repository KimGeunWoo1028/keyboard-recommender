from __future__ import annotations

import json
from pathlib import Path

from keyboard_recommender.catalog.swagkey_spec_scrape_queue import build_spec_scrape_queue


def test_spec_scrape_queue_prioritizes_case_then_switch() -> None:
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
    queue, report = build_spec_scrape_queue(payload)
    assert report.queued > 0
    targets = queue["targets"]
    families = [str(row["family"]) for row in targets]
    if "case" in families and "switch" in families:
        assert families.index("case") < families.index("switch")
    assert all(row.get("recommendationEligible") is False for row in targets)
