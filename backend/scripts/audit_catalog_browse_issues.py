#!/usr/bin/env python3
"""Audit catalog browse data-quality issues (missing image, wrong idx, shared images)."""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path

from keyboard_recommender.application.catalog_browse_service import list_catalog_parts
from keyboard_recommender.catalog.catalog_browse_policy import swagkey_product_idx

TAB = {
    "switch": "스위치",
    "plate": "플레이트",
    "foam": "폼",
    "layout": "레이아웃",
    "case": "케이스/키트",
    "keycap": "키캡",
}


def main() -> int:
    issues: dict[str, dict[str, list[dict[str, str]]]] = {
        fam: {"no_image": [], "shared_image": []} for fam in TAB
    }
    rows: list[tuple[str, str, str, str, str]] = []

    for fam in TAB:
        for item in list_catalog_parts(fam, limit=500).items:  # type: ignore[arg-type]
            rows.append((fam, item.id, item.name, swagkey_product_idx(item.source_url), item.image_url))

    for fam, item_id, name, source_idx, img in rows:
        if not str(img or "").strip():
            issues[fam]["no_image"].append(
                {"id": item_id, "name": name, "idx": source_idx},
            )

    by_img: dict[str, list[tuple[str, str, str, str]]] = defaultdict(list)
    for fam, item_id, name, source_idx, img in rows:
        if fam == "layout" or not img:
            continue
        by_img[img].append((fam, item_id, name, source_idx))

    for img, group in by_img.items():
        idxs = {g[3] for g in group}
        if len(group) <= 1 or len(idxs) <= 1:
            continue
        for fam, item_id, name, source_idx in group:
            others = [f"{n} (idx={o})" for f, i, n, o in group if i != item_id]
            issues[fam]["shared_image"].append(
                {
                    "id": item_id,
                    "name": name,
                    "idx": source_idx,
                    "detail": ", ".join(others),
                },
            )

    report = {
        "schemaVersion": "1.0.0",
        "tabs": {
            label: {
                "noImage": issues[fam]["no_image"],
                "sharedImage": issues[fam]["shared_image"],
            }
            for fam, label in TAB.items()
            if issues[fam]["no_image"] or issues[fam]["shared_image"]
        },
        "summary": {
            "noImageCount": sum(len(v["no_image"]) for v in issues.values()),
            "sharedImageCount": sum(len(v["shared_image"]) for v in issues.values()),
        },
    }

    out = Path(__file__).resolve().parents[1] / "data/swagkey_inventory/catalog_browse_audit_report.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"out={out}")

    if report["summary"]["sharedImageCount"] > 0:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
