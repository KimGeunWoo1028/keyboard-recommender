"""Promote browse seed rows into the recommendation pool (Phase 6-2)."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

from keyboard_recommender.catalog.layout_diagrams import is_layout_archetype_part_id
from keyboard_recommender.trait_engine.catalog_sample import is_recommendation_eligible_row

PROMOTION_SCHEMA_VERSION = "1.0.0"
PromoteFamily = Literal["switch", "plate", "foam", "layout", "case", "keycap"]
_KEYCAP_PROMOTABLE_SCOPES = frozenset({"full", "base", "noveset"})


@dataclass(slots=True)
class PromotionCandidate:
    family: PromoteFamily
    seed_id: str
    name: str
    reason: str
    trait_confidence: str = ""


@dataclass(slots=True)
class RecommendationPromotionReport:
    schema_version: str = PROMOTION_SCHEMA_VERSION
    generated_at: str = ""
    dry_run: bool = True
    seed_path: str = ""
    eligible: list[PromotionCandidate] = field(default_factory=list)
    rejected: list[PromotionCandidate] = field(default_factory=list)
    promoted: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "schemaVersion": self.schema_version,
            "generatedAt": self.generated_at,
            "dryRun": self.dry_run,
            "seedPath": self.seed_path,
            "promotedCount": len(self.promoted),
            "eligiblePreview": [
                {"family": c.family, "seedId": c.seed_id, "name": c.name, "reason": c.reason}
                for c in self.eligible[:50]
            ],
            "rejectedPreview": [
                {"family": c.family, "seedId": c.seed_id, "name": c.name, "reason": c.reason}
                for c in self.rejected[:50]
            ],
            "promoted": self.promoted,
        }


def _keycap_scope(row: dict[str, Any]) -> str:
    meta = row.get("metadata") if isinstance(row.get("metadata"), dict) else {}
    return str(meta.get("kit_scope") or row.get("subtype") or "").strip().lower()


def _case_layout_size(row: dict[str, Any]) -> str:
    meta = row.get("metadata") if isinstance(row.get("metadata"), dict) else {}
    return str(meta.get("layout_size") or "").strip()


def evaluate_promotion(row: dict[str, Any], *, family: PromoteFamily) -> tuple[bool, str]:
    if is_recommendation_eligible_row(row, family=family):
        return False, "already_recommendation_eligible"

    trait_confidence = str(row.get("traitConfidence") or "").strip()
    if trait_confidence not in {"spec_scraped", "manual_curated"}:
        return False, f"trait_confidence_not_ready:{trait_confidence or 'missing'}"

    if family == "keycap":
        scope = _keycap_scope(row)
        if scope not in _KEYCAP_PROMOTABLE_SCOPES:
            return False, f"keycap_scope_not_promotable:{scope or 'unknown'}"
        meta = row.get("metadata") if isinstance(row.get("metadata"), dict) else {}
        if not str(meta.get("profile") or "").strip():
            return False, "keycap_profile_missing"
        if not str(meta.get("material") or "").strip():
            return False, "keycap_material_missing"

    if family == "case":
        if not _case_layout_size(row):
            return False, "case_layout_size_missing"

    if family == "layout" and not is_layout_archetype_part_id(str(row.get("id") or "")):
        return False, "layout_real_pcb_browse_only"

    return True, "ready"


def _iter_seed_mutable_rows(payload: dict[str, Any]) -> list[tuple[PromoteFamily, list[Any], int]]:
    found: list[tuple[PromoteFamily, list[Any], int]] = []
    switches = payload.get("switches")
    if isinstance(switches, dict):
        for rows in switches.values():
            if not isinstance(rows, list):
                continue
            for index, row in enumerate(rows):
                if isinstance(row, dict):
                    found.append(("switch", rows, index))

    for family, key in (
        ("plate", "plates"),
        ("foam", "foams"),
        ("layout", "layouts"),
        ("case", "cases"),
        ("keycap", "keycaps"),
    ):
        rows = payload.get(key)
        if not isinstance(rows, list):
            continue
        for index, row in enumerate(rows):
            if isinstance(row, dict):
                found.append((family, rows, index))
    return found


def promote_recommendation_pool(
    seed_payload: dict[str, Any],
    *,
    seed_ids: set[str] | None = None,
    dry_run: bool = True,
) -> tuple[dict[str, Any], RecommendationPromotionReport]:
    merged = json.loads(json.dumps(seed_payload))
    report = RecommendationPromotionReport(
        generated_at=datetime.now(UTC).isoformat(),
        dry_run=dry_run,
    )

    for family, rows, row_index in _iter_seed_mutable_rows(merged):
        row = rows[row_index]
        if not isinstance(row, dict):
            continue
        seed_id = str(row.get("id") or "").strip()
        if not seed_id:
            continue
        if seed_ids is not None and seed_id not in seed_ids:
            continue

        ok, reason = evaluate_promotion(row, family=family)
        candidate = PromotionCandidate(
            family=family,
            seed_id=seed_id,
            name=str(row.get("name") or "").strip(),
            reason=reason,
            trait_confidence=str(row.get("traitConfidence") or "").strip(),
        )
        if not ok:
            report.rejected.append(candidate)
            continue

        report.eligible.append(candidate)
        if dry_run:
            continue
        row["recommendationEligible"] = True
        if family == "keycap":
            row["inRecommendationPool"] = True
        report.promoted.append(seed_id)

    return merged, report


def load_seed_payload(seed_path: Path) -> dict[str, Any]:
    return json.loads(seed_path.read_text(encoding="utf-8"))
