"""Merge curated keycaps into swagkey_products.seed.json (roadmap ⑭).

Full catalog rows stay inRecommendationPool=false (browse-only contract).
Recommendation pool is seed `keycaps[]` with inRecommendationPool=true.
"""

from __future__ import annotations

import json
from pathlib import Path

from keyboard_recommender.catalog.swagkey_keycap_seed_builder import build_curated_keycap_seed

_BACKEND = Path(__file__).resolve().parents[1]
_SEED = _BACKEND / "src/keyboard_recommender/catalog/swagkey_products.seed.json"
_FULL = _BACKEND / "data/swagkey_inventory/swagkey_catalog_full.json"
_REPORT = _BACKEND / "data/swagkey_inventory/keycap_seed_merge_report.json"


def main() -> None:
    full = json.loads(_FULL.read_text(encoding="utf-8"))
    items = full.get("items") if isinstance(full, dict) else []
    if not isinstance(items, list):
        raise SystemExit("full catalog items missing")

    keycaps = build_curated_keycap_seed(items)
    seed = json.loads(_SEED.read_text(encoding="utf-8"))
    seed["keycaps"] = keycaps
    _SEED.write_text(json.dumps(seed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    report = {
        "seedKeycapCount": len(keycaps),
        "seedIds": [r["id"] for r in keycaps],
        "fullCatalogIds": [r.get("fullCatalogId") for r in keycaps],
        "note": "full catalog remains inRecommendationPool=false; seed keycaps are the recommendation pool",
    }
    _REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
