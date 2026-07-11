"""Switch winner family frequencies from persisted evaluation snapshots."""

from __future__ import annotations

from collections import Counter
from collections.abc import Mapping
from typing import Any


def switch_family_from_snapshot(snapshot: Mapping[str, Any]) -> str | None:
    sel = snapshot.get("selected")
    if not isinstance(sel, dict):
        return None
    sw = sel.get("switch")
    if not isinstance(sw, dict):
        return None
    fam = sw.get("family")
    if fam is None or fam == "":
        return str(sw.get("itemId")) if sw.get("itemId") is not None else None
    return str(fam)


def family_counts_from_snapshot_rows(rows: list[dict[str, Any]], *, snapshot_key: str = "snapshot") -> dict[str, int]:
    c: Counter[str] = Counter()
    for row in rows:
        snap = row.get(snapshot_key)
        if not isinstance(snap, dict):
            continue
        fam = switch_family_from_snapshot(snap)
        if fam:
            c[fam] += 1
    return dict(sorted(c.items(), key=lambda kv: (-kv[1], kv[0])))
