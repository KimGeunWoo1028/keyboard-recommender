#!/usr/bin/env python3
"""Generate plate/foam scraping targets from swagkey seed rows."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def _collect_rows(seed: dict, key: str) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    rows = seed.get(key)
    if not isinstance(rows, list):
        return out
    for row in rows:
        if not isinstance(row, dict):
            continue
        sid = str(row.get("id") or "").strip()
        url = str(row.get("sourceUrl") or "").strip()
        name = str(row.get("name") or "").strip()
        if sid and url:
            out.append({"id": sid, "url": url, "name": name})
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", required=True, help="Path to swagkey_products.seed.json")
    parser.add_argument("--out", required=True, help="Output targets JSON path")
    args = parser.parse_args()

    seed = json.loads(Path(args.seed).read_text(encoding="utf-8"))
    payload = {
        "plates": _collect_rows(seed, "plates"),
        "foams": _collect_rows(seed, "foams"),
    }

    out_path = Path(args.out).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote: {out_path} (plates={len(payload['plates'])}, foams={len(payload['foams'])})")


if __name__ == "__main__":
    main()

