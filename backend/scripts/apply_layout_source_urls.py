"""Populate sourceUrl on layout seed rows from matching case kits (by name or layout_size)."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

_REPO = Path(__file__).resolve().parents[2]
_DEFAULT_SEED = _REPO / "backend" / "src" / "keyboard_recommender" / "catalog" / "swagkey_products.seed.json"


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def _resolve_layout_url(layout: dict[str, Any], cases: list[dict[str, Any]]) -> str:
    name = str(layout.get("name") or "")
    layout_size = str((layout.get("metadata") or {}).get("layout_size") or "")
    needle = _norm(name.replace(" 조합", ""))

    case_by_name = {_norm(str(c.get("name") or "")): c for c in cases}
    for case_name, case in case_by_name.items():
        if needle and (needle in case_name or case_name in needle):
            url = str(case.get("sourceUrl") or "").strip()
            if url:
                return url

    by_size: dict[str, str] = {}
    for case in cases:
        size = str((case.get("metadata") or {}).get("layout_size") or "")
        url = str(case.get("sourceUrl") or "").strip()
        if size and url and size not in by_size:
            by_size[size] = url

    if layout_size in by_size:
        return by_size[layout_size]

    if layout_size == "split":
        for case in cases:
            if "split" in _norm(str(case.get("name") or "")):
                url = str(case.get("sourceUrl") or "").strip()
                if url:
                    return url
        return by_size.get("60", "")

    return ""


def apply_layout_source_urls(seed_payload: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, str]]]:
    out = json.loads(json.dumps(seed_payload, ensure_ascii=False))
    cases = [row for row in (out.get("cases") or []) if isinstance(row, dict)]
    layouts = out.get("layouts")
    if not isinstance(layouts, list):
        return out, []

    report: list[dict[str, str]] = []
    for row in layouts:
        if not isinstance(row, dict):
            continue
        before = str(row.get("sourceUrl") or row.get("source_url") or "").strip()
        after = _resolve_layout_url(row, cases)
        if after:
            row["sourceUrl"] = after
        report.append(
            {
                "id": str(row.get("id") or ""),
                "name": str(row.get("name") or ""),
                "before": before,
                "after": after,
            },
        )
    return out, report


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply layout sourceUrl from case kit matches.")
    parser.add_argument("--seed", type=Path, default=_DEFAULT_SEED)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    payload = json.loads(args.seed.read_text(encoding="utf-8"))
    updated, report = apply_layout_source_urls(payload)
    missing = [row for row in report if not row["after"]]
    print(f"layouts: {len(report)} updated, {len(missing)} unresolved")
    for row in missing:
        print(f"  unresolved: {row['id']} ({row['name']})")

    if args.dry_run:
        return

    args.seed.write_text(json.dumps(updated, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {args.seed}")


if __name__ == "__main__":
    main()
