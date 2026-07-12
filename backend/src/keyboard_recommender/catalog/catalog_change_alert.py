"""Build catalog change alerts from seed↔crawl inventory diff (roadmap ⑮)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

from keyboard_recommender.catalog.layout_diagrams import is_layout_archetype_part_id

ALERT_SCHEMA_VERSION = "1.2.0"

AlertTier = Literal["blocking", "informational"]


def _rows(diff_payload: dict[str, Any], *keys: str) -> list[dict[str, Any]]:
    for key in keys:
        node = diff_payload.get(key)
        if isinstance(node, list):
            return [row for row in node if isinstance(row, dict)]
    return []


def _row_eligible(row: dict[str, Any]) -> bool | None:
    if "recommendation_eligible" in row:
        return row.get("recommendation_eligible")  # type: ignore[return-value]
    if "recommendationEligible" in row:
        return row.get("recommendationEligible")  # type: ignore[return-value]
    return None


def _is_blocking_row(row: dict[str, Any], status: str) -> bool:
    if status == "new_in_crawl":
        return False
    if status == "seed_only":
        seed_id = str(row.get("seed_id") or row.get("seedId") or "").strip()
        if is_layout_archetype_part_id(seed_id):
            return False
    eligible = _row_eligible(row)
    if eligible is None:
        return False
    return eligible


def _tier_for_row(row: dict[str, Any], status: str) -> AlertTier:
    return "blocking" if _is_blocking_row(row, status) else "informational"


def _slim(row: dict[str, Any], *, status: str) -> dict[str, Any]:
    slim: dict[str, Any] = {
        "family": row.get("family"),
        "seedId": row.get("seed_id") or row.get("seedId"),
        "seedName": row.get("seed_name") or row.get("seedName"),
        "crawlId": row.get("crawl_id") or row.get("crawlId"),
        "crawlName": row.get("crawl_name") or row.get("crawlName"),
        "similarity": row.get("similarity"),
        "alertTier": _tier_for_row(row, status),
    }
    eligible = _row_eligible(row)
    if eligible is not None:
        slim["recommendationEligible"] = eligible
    if status == "new_in_crawl":
        slim["browseMergeCandidate"] = True
    return slim


def build_catalog_change_alert(
    diff_payload: dict[str, Any],
    *,
    generated_at: str | None = None,
    image_url_changes: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """
    Map seed_inventory_diff.json into an ops-facing alert report.

    Semantics (no stock field in crawl):
    - new_in_crawl → browse merge candidates (informational)
    - seed_only → possibly discontinued; blocking only when recommendationEligible
    - name_changed → rename drift; blocking only when recommendationEligible
    """
    stats = diff_payload.get("stats") if isinstance(diff_payload.get("stats"), dict) else {}
    source = diff_payload.get("source") if isinstance(diff_payload.get("source"), dict) else {}

    new_rows = _rows(diff_payload, "new_in_crawl", "newInCrawl")
    seed_only_rows = _rows(diff_payload, "seed_only", "seedOnly")
    rename_rows = _rows(diff_payload, "name_changed", "nameChanged")

    # Fallback: flat pairs[] shape used by unit fixtures / older dumps
    if not new_rows and not seed_only_rows and not rename_rows:
        pairs = diff_payload.get("pairs")
        if isinstance(pairs, list):
            for row in pairs:
                if not isinstance(row, dict):
                    continue
                status = str(row.get("status") or "")
                if status == "new_in_crawl":
                    new_rows.append(row)
                elif status == "seed_only":
                    seed_only_rows.append(row)
                elif status == "name_changed":
                    rename_rows.append(row)

    new_items = [_slim(r, status="new_in_crawl") for r in new_rows]
    possibly_discontinued = [_slim(r, status="seed_only") for r in seed_only_rows]
    renames = [_slim(r, status="name_changed") for r in rename_rows]

    new_count = int(stats.get("newInCrawl") or diff_payload.get("new_in_crawl_count") or len(new_items))
    seed_only_count = int(stats.get("seedOnly") or diff_payload.get("seed_only_count") or len(possibly_discontinued))
    rename_count = int(stats.get("nameChanged") or diff_payload.get("name_changed_count") or len(renames))
    matched_count = int(stats.get("matched") or diff_payload.get("matched_count") or 0)
    image_changes = list(image_url_changes or [])
    image_change_count = len(image_changes)

    blocking_discontinued = [row for row in possibly_discontinued if row.get("alertTier") == "blocking"]
    blocking_renames = [row for row in renames if row.get("alertTier") == "blocking"]
    informational_discontinued = [row for row in possibly_discontinued if row.get("alertTier") == "informational"]
    informational_renames = [row for row in renames if row.get("alertTier") == "informational"]

    informational_count = len(new_items) + len(informational_discontinued) + len(informational_renames)
    blocking_count = len(blocking_discontinued) + len(blocking_renames) + image_change_count
    alert_count = blocking_count + informational_count

    return {
        "schemaVersion": ALERT_SCHEMA_VERSION,
        "kind": "swagkey_catalog_change_alert",
        "generatedAt": generated_at or datetime.now(UTC).replace(microsecond=0).isoformat(),
        "source": {
            "seedPath": source.get("seedPath") or diff_payload.get("seed_path") or "",
            "candidatesPath": source.get("candidatesPath") or diff_payload.get("candidates_path") or "",
            "diffGeneratedAt": source.get("generatedAt")
            or diff_payload.get("generated_at")
            or diff_payload.get("generatedAt")
            or "",
        },
        "counts": {
            "matched": matched_count,
            "newInCrawl": new_count,
            "possiblyDiscontinued": seed_only_count,
            "nameChanged": rename_count,
            "imageUrlChanged": image_change_count,
            "browseMergeCandidates": new_count,
            "informationalTotal": informational_count,
            "blockingAlertTotal": blocking_count,
            "alertTotal": blocking_count,
        },
        "hasAlerts": alert_count > 0,
        "hasBlockingAlerts": blocking_count > 0,
        "newInCrawl": new_items,
        "browseMergeCandidates": new_items,
        "possiblyDiscontinued": possibly_discontinued,
        "blockingPossiblyDiscontinued": blocking_discontinued,
        "informationalPossiblyDiscontinued": informational_discontinued,
        "nameChanged": renames,
        "blockingNameChanged": blocking_renames,
        "informationalNameChanged": informational_renames,
        "imageUrlChanged": image_changes,
        "notes": [
            "seed_only is treated as possibly discontinued (missing from latest crawl inventory).",
            "new_in_crawl are browse merge candidates (informational; run merge_inventory_browse_seed dry-run).",
            "blocking alerts require recommendationEligible=true on the seed row.",
            "layout archetype seed rows (layout-001…007) are reference-only and never blocking seed_only.",
            "Crawl inventory has no explicit stock/품절 flag; title stock markers are stripped at crawl time.",
            "imageUrlChanged compares seed imageUrl to refetched og:image (fixture cache or live HTTP).",
            "Webhooks notify blockingAlertTotal + imageUrlChanged only (Phase 7).",
        ],
    }


def format_catalog_change_alert_text(alert: dict[str, Any]) -> str:
    counts = alert.get("counts") if isinstance(alert.get("counts"), dict) else {}
    lines = [
        "Swagkey catalog change alert (roadmap ⑮)",
        f"generated: {alert.get('generatedAt', '')}",
        "",
        f"matched: {counts.get('matched', 0)}",
        f"new in crawl (browse merge): {counts.get('newInCrawl', 0)}",
        f"possibly discontinued (seed_only): {counts.get('possiblyDiscontinued', 0)}",
        f"name changed: {counts.get('nameChanged', 0)}",
        f"image url changed: {counts.get('imageUrlChanged', 0)}",
        f"blocking alert total: {counts.get('blockingAlertTotal', counts.get('alertTotal', 0))}",
        f"informational total: {counts.get('informationalTotal', 0)}",
        "",
    ]
    for title, key in (
        ("BROWSE MERGE CANDIDATES (new_in_crawl)", "browseMergeCandidates"),
        ("BLOCKING — POSSIBLY DISCONTINUED", "blockingPossiblyDiscontinued"),
        ("INFORMATIONAL — POSSIBLY DISCONTINUED", "informationalPossiblyDiscontinued"),
        ("BLOCKING — NAME CHANGED", "blockingNameChanged"),
        ("INFORMATIONAL — NAME CHANGED", "informationalNameChanged"),
        ("IMAGE URL CHANGED", "imageUrlChanged"),
    ):
        rows = alert.get(key) if isinstance(alert.get(key), list) else []
        lines.append(f"## {title} ({len(rows)})")
        if not rows:
            lines.append("(none)")
        else:
            for row in rows[:50]:
                if not isinstance(row, dict):
                    continue
                if key == "imageUrlChanged":
                    fam = row.get("family") or "?"
                    sid = row.get("seedId") or "-"
                    sname = row.get("seedName") or "-"
                    idx = row.get("swagkeyProductId") or "-"
                    prev = row.get("previousImageUrl") or "-"
                    curr = row.get("currentImageUrl") or "-"
                    lines.append(f"- [{fam}] seed={sid}/{sname} idx={idx}")
                    lines.append(f"  prev: {prev}")
                    lines.append(f"  curr: {curr}")
                    continue
                fam = row.get("family") or "?"
                sid = row.get("seedId") or "-"
                sname = row.get("seedName") or "-"
                cid = row.get("crawlId") or "-"
                cname = row.get("crawlName") or "-"
                tier = row.get("alertTier") or "?"
                lines.append(f"- [{fam}] tier={tier} seed={sid}/{sname} crawl={cid}/{cname}")
            if len(rows) > 50:
                lines.append(f"... and {len(rows) - 50} more")
        lines.append("")
    notes = alert.get("notes") if isinstance(alert.get("notes"), list) else []
    if notes:
        lines.append("notes:")
        lines.extend(f"  - {n}" for n in notes if isinstance(n, str))
    return "\n".join(lines).rstrip() + "\n"
