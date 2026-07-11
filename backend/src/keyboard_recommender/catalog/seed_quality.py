"""Roadmap ⑪ — seed recommendation-pool quality actions (URL overrides, discontinued removal)."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from html import unescape
from pathlib import Path
from typing import Any

from keyboard_recommender.catalog.swagkey_seed_inventory_diff import name_similarity, pairing_allowed
from keyboard_recommender.catalog.swagkey_source_url import shop_view_product_url

# Discontinued on Swagkey or duplicate SKU — remove from recommendation pool.
SEED_REMOVE_IDS: frozenset[str] = frozenset(
    {
        "sw-linear-004",  # Keygeek DingDing — no live product / crawl match
        "sw-linear-014",  # Keygeek Ash — discontinued
        "sw-other-002",  # TTC Brother V2 — discontinued
        "sw-other-012",  # Gazzew U4T — discontinued
        "sw-silent-001",  # duplicate of sw-linear-003 (HMX Peach)
    },
)

# Verified Swagkey product idx values (inventory v2 + HTML cache audit 2026-07-07).
SEED_URL_IDX_OVERRIDES: dict[str, str] = {
    "sw-linear-006": "1668",
    "sw-tactile-003": "1443",
    "sw-silent-002": "1589",
    "sw-silent-003": "1258",
    "sw-silent-004": "1216",
    "sw-other-003": "1677",
    "sw-other-005": "1673",
    "sw-other-006": "1667",
    "sw-other-008": "1658",
    "sw-other-011": "1496",
    "sw-other-016": "1340",
    "sw-other-020": "1206",
    "sw-other-021": "1187",
}

_PRODUCT_PROPS_RE = re.compile(
    r"data-product-properties='(\{.*?\})'",
    re.DOTALL,
)


@dataclass
class SeedQualityReport:
    removed: list[dict[str, str]] = field(default_factory=list)
    url_overrides: list[dict[str, str]] = field(default_factory=list)
    html_cache_matches: list[dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "removed": self.removed,
            "urlOverrides": self.url_overrides,
            "htmlCacheMatches": self.html_cache_matches,
            "removedCount": len(self.removed),
            "urlOverrideCount": len(self.url_overrides),
        }


def _iter_switch_rows(seed_payload: dict[str, Any]) -> list[tuple[str, dict[str, Any]]]:
    out: list[tuple[str, dict[str, Any]]] = []
    switches = seed_payload.get("switches")
    if not isinstance(switches, dict):
        return out
    for subtype, rows in switches.items():
        if not isinstance(rows, list):
            continue
        for row in rows:
            if isinstance(row, dict):
                out.append((str(subtype), row))
    return out


def remove_seed_ids(seed_payload: dict[str, Any], remove_ids: frozenset[str]) -> list[dict[str, str]]:
    removed: list[dict[str, str]] = []
    switches = seed_payload.get("switches")
    if not isinstance(switches, dict):
        return removed
    for subtype, rows in switches.items():
        if not isinstance(rows, list):
            continue
        kept: list[dict[str, Any]] = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            seed_id = str(row.get("id") or "").strip()
            if seed_id in remove_ids:
                removed.append(
                    {
                        "id": seed_id,
                        "name": str(row.get("name") or "").strip(),
                        "subtype": str(subtype),
                    },
                )
                continue
            kept.append(row)
        switches[subtype] = kept
    return removed


def _products_from_html_cache(cache_path: Path) -> list[tuple[str, str]]:
    if not cache_path.is_file():
        return []
    text = cache_path.read_text(encoding="utf-8", errors="replace")
    out: list[tuple[str, str]] = []
    for match in _PRODUCT_PROPS_RE.finditer(text):
        raw = unescape(match.group(1)).replace("&quot;", '"')
        try:
            props = json.loads(raw)
        except json.JSONDecodeError:
            continue
        name = str(props.get("name") or "").strip()
        idx = str(props.get("idx") or "").strip()
        if name and idx.isdigit():
            out.append((name, idx))
    return out


def _best_html_cache_idx(seed_name: str, cache_path: Path, *, threshold: float = 0.92) -> str:
    best_idx = ""
    best_score = 0.0
    for product_name, idx in _products_from_html_cache(cache_path):
        score = name_similarity(seed_name, product_name)
        if score > best_score and score >= threshold and pairing_allowed(seed_name, product_name):
            best_score = score
            best_idx = idx
    return best_idx


def apply_seed_url_overrides(
    seed_payload: dict[str, Any],
    *,
    overrides: dict[str, str] | None = None,
    html_cache_dir: Path | None = None,
    report: SeedQualityReport | None = None,
) -> None:
    """Set ``sourceUrl`` on seed rows from verified idx overrides (+ optional HTML cache)."""
    idx_map = dict(SEED_URL_IDX_OVERRIDES)
    if overrides:
        idx_map.update(overrides)

    for _subtype, row in _iter_switch_rows(seed_payload):
        seed_id = str(row.get("id") or "").strip()
        if not seed_id or seed_id in SEED_REMOVE_IDS:
            continue
        name = str(row.get("name") or "").strip()
        product_idx = idx_map.get(seed_id, "")
        if not product_idx and html_cache_dir is not None:
            product_idx = _best_html_cache_idx(name, html_cache_dir / f"{seed_id}.html")
            if product_idx and report is not None:
                report.html_cache_matches.append(
                    {"id": seed_id, "name": name, "idx": product_idx},
                )
        if not product_idx:
            continue
        after = shop_view_product_url(product_idx)
        before = str(row.get("sourceUrl") or "").strip()
        if before != after:
            row["sourceUrl"] = after
            if report is not None:
                report.url_overrides.append(
                    {"id": seed_id, "name": name, "before": before, "after": after},
                )


def apply_seed_quality_cleanup(
    seed_payload: dict[str, Any],
    *,
    remove_ids: frozenset[str] | None = None,
    html_cache_dir: Path | None = None,
) -> tuple[dict[str, Any], SeedQualityReport]:
    """Return a cleaned seed copy: drop discontinued rows, apply verified product URLs."""
    out = json.loads(json.dumps(seed_payload, ensure_ascii=False))
    report = SeedQualityReport()
    report.removed = remove_seed_ids(out, remove_ids or SEED_REMOVE_IDS)
    apply_seed_url_overrides(out, html_cache_dir=html_cache_dir, report=report)
    return out, report


def filter_json_rows_by_ids(payload: dict[str, Any], list_key: str, remove_ids: frozenset[str]) -> int:
    """Remove rows with ``id`` in *remove_ids* from ``payload[list_key]`` list."""
    rows = payload.get(list_key)
    if not isinstance(rows, list):
        return 0
    before = len(rows)
    payload[list_key] = [
        row for row in rows if not (isinstance(row, dict) and str(row.get("id") or "").strip() in remove_ids)
    ]
    return before - len(payload[list_key])
