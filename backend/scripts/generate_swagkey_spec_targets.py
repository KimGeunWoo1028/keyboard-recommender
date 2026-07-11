#!/usr/bin/env python3
"""Generate scraping targets from swagkey seed switch rows."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", required=True, help="Path to swagkey_products.seed.json")
    parser.add_argument("--out", required=True, help="Output targets JSON path")
    args = parser.parse_args()

    seed = json.loads(Path(args.seed).read_text(encoding="utf-8"))
    switches = seed.get("switches") or {}
    rows: list[dict[str, str]] = []
    for subtype_rows in switches.values():
        if not isinstance(subtype_rows, list):
            continue
        for row in subtype_rows:
            if not isinstance(row, dict):
                continue
            sid = str(row.get("id") or "").strip()
            url = str(row.get("sourceUrl") or "").strip()
            name = str(row.get("name") or "").strip()
            if sid and url:
                rows.append({"id": sid, "url": url, "name": name})

    out_path = Path(args.out).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps({"switches": rows}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote: {out_path} ({len(rows)} rows)")


if __name__ == "__main__":
    main()

