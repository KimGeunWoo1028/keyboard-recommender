#!/usr/bin/env python3
"""Record HTTP verification for switch image remediation (404 vs live)."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from datetime import UTC, datetime
from pathlib import Path

from keyboard_recommender.catalog.swagkey_crawler_v2 import extract_product_id_from_url

# Seed switches that had browse image gaps before remediation (2026-07-10).
CHECKS: list[tuple[str, str]] = [
    ("sw-other-003", "https://www.swagkey.kr/shop_view/?idx=1677"),
    ("sw-other-005", "https://www.swagkey.kr/shop_view/?idx=1673"),
    ("sw-other-006", "https://www.swagkey.kr/shop_view/?idx=1667"),
    ("sw-other-008", "https://www.swagkey.kr/shop_view/?idx=1658"),
    ("sw-other-011", "https://www.swagkey.kr/shop_view/?idx=1496"),
    ("sw-other-016", "https://www.swagkey.kr/shop_view/?idx=1340"),
    ("sw-other-020", "https://www.swagkey.kr/shop_view/?idx=1206"),
    ("sw-other-021", "https://www.swagkey.kr/shop_view/?idx=1187"),
    ("sw-linear-006", "https://www.swagkey.kr/shop_view/?idx=1668"),
]


def probe(url: str) -> tuple[int | None, str]:
    request = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return response.status, "ok"
    except urllib.error.HTTPError as exc:
        return exc.code, str(exc.reason)
    except Exception as exc:  # noqa: BLE001
        return None, type(exc).__name__


def main() -> int:
    rows = []
    for seed_id, url in CHECKS:
        status, detail = probe(url)
        rows.append(
            {
                "seedId": seed_id,
                "sourceUrl": url,
                "swagkeyProductId": extract_product_id_from_url(url),
                "httpStatus": status,
                "detail": detail,
                "action": "browse_exclude" if status == 404 else "fetch_image",
            },
        )

    report = {
        "schemaVersion": "1.0.0",
        "generatedAt": datetime.now(UTC).isoformat(),
        "rows": rows,
        "browseExcludeIdx": sorted(
            {row["swagkeyProductId"] for row in rows if row["httpStatus"] == 404 and row["swagkeyProductId"]},
        ),
    }
    out = Path(__file__).resolve().parents[1] / "data/swagkey_inventory/switch_image_remediation_report.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"out={out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
