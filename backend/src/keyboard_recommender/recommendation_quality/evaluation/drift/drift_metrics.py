"""Small numeric summaries for drift narratives (no scipy / no heavy stats)."""

from __future__ import annotations

from collections.abc import Mapping


def max_share(counts: Mapping[str, int]) -> tuple[str | None, float]:
    """Return (top_key, share) for the largest bucket; share is 0 when empty."""
    if not counts:
        return None, 0.0
    total = sum(int(v) for v in counts.values())
    if total <= 0:
        return None, 0.0
    top_key = max(counts.items(), key=lambda kv: kv[1])[0]
    share = float(counts[top_key]) / float(total)
    return str(top_key), round(share, 6)


def fallback_recovery_rate(rows: list[dict], *, key: str = "snapshot") -> dict[str, float | int]:
    """Fraction of snapshots in ``rows`` whose ``fallbackAudit.recovered`` is true."""
    n = 0
    ok = 0
    for row in rows:
        snap = row.get(key)
        if not isinstance(snap, dict):
            continue
        fb = snap.get("fallbackAudit")
        if not isinstance(fb, dict):
            continue
        n += 1
        if bool(fb.get("recovered")):
            ok += 1
    rate = round(ok / n, 6) if n else 0.0
    return {"runsWithFallbackAudit": n, "recoveredCount": ok, "recoveredRate": rate}
