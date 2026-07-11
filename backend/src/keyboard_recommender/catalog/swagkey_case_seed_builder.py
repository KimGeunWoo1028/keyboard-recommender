"""Build keyboard_cases seed rows from Swagkey case_kit inventory candidates."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

from keyboard_recommender.catalog.metadata_mapping import derive_case_traits
from keyboard_recommender.catalog.metadata_models import CaseMetadata

KitType = Literal["barebone", "complete", "parts", "he_kit", "kit"]
CASE_SEED_SCHEMA_VERSION = "1.0.0"
_HE_RE = re.compile(r"\bhe\b|he\+|sonic he|hall[\s-]?effect", re.IGNORECASE)


@dataclass(slots=True)
class CaseSeedReport:
    schema_version: str = CASE_SEED_SCHEMA_VERSION
    generated_at: str = ""
    candidate_count: int = 0
    added: int = 0
    skipped_existing: int = 0
    rejected: list[dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "schemaVersion": self.schema_version,
            "generatedAt": self.generated_at,
            "candidateCount": self.candidate_count,
            "added": self.added,
            "skippedExisting": self.skipped_existing,
            "rejected": self.rejected,
        }


def infer_kit_type(name: str) -> KitType:
    n = name.lower()
    if any(tok in n for tok in ("파츠", "parts", "하우징", "상판", "하부")):
        return "parts"
    if "완제품" in n or "complete" in n:
        return "complete"
    if _HE_RE.search(n) or "마그네틱" in n or "자석" in n:
        return "he_kit"
    if "베어본" in n or "barebone" in n or "bare bone" in n:
        return "barebone"
    return "kit"


def infer_layout_size(name: str) -> str | None:
    n = name.lower()
    if "104" in n or "full" in n or "100%" in n:
        return "full"
    if "96" in n or "98" in n:
        return "96"
    if "tkl" in n or "80%" in n or re.search(r"\b80\b", n):
        return "80_tkl"
    if "75" in n:
        return "75"
    if "65" in n:
        return "65"
    if "60" in n:
        return "60"
    if "40" in n:
        return "40"
    if "alice" in n:
        return "alice"
    if "split" in n:
        return "split"
    return None


def infer_material(name: str) -> str | None:
    n = name.lower()
    if "알루미늄" in n or "aluminum" in n or "alu" in n:
        return "Aluminum"
    if "brass" in n or "黄銅" in n:
        return "Brass"
    if "pc" in n or "polycarbonate" in n:
        return "PC"
    if "pom" in n:
        return "POM"
    return None


def infer_mounting_style(name: str) -> str:
    n = name.lower()
    if "leaf" in n or "리프" in n:
        return "leaf_spring"
    if "sandwich" in n or "샌드위치" in n:
        return "sandwich"
    if "tray" in n or "트레이" in n:
        return "tray"
    if "top mount" in n or "top-mount" in n:
        return "top"
    return "gasket"


def infer_acoustic_character(name: str, material: str | None) -> str:
    n = name.lower()
    if "thock" in n or "deep" in n or "묵직" in n:
        return "deep"
    if "bright" in n or "clack" in n:
        return "bright"
    mat = str(material or "").lower()
    if "aluminum" in mat or "brass" in mat:
        return "deep"
    if "pc" in mat:
        return "bright"
    return "balanced"


def infer_includes(kit_type: KitType) -> dict[str, bool]:
    if kit_type == "parts":
        return {
            "includes_pcb": False,
            "includes_plate": False,
            "includes_foam": False,
            "includes_switches": False,
            "includes_keycaps": False,
        }
    if kit_type == "complete":
        return {
            "includes_pcb": True,
            "includes_plate": True,
            "includes_foam": True,
            "includes_switches": True,
            "includes_keycaps": True,
        }
    return {
        "includes_pcb": True,
        "includes_plate": True,
        "includes_foam": False,
        "includes_switches": False,
        "includes_keycaps": False,
    }


def infer_case_metadata(name: str, *, brand: str = "") -> CaseMetadata:
    kit_type = infer_kit_type(name)
    material = infer_material(name)
    layout_size = infer_layout_size(name)
    mounting_style = infer_mounting_style(name)
    acoustic = infer_acoustic_character(name, material)
    includes = infer_includes(kit_type)
    weight_class = "heavy" if material == "Aluminum" else "balanced"
    return CaseMetadata.model_validate(
        {
            "kit_type": kit_type,
            "material": material,
            "mounting_style": mounting_style,
            "layout_size": layout_size,
            "ansi_iso_support": "both",
            **includes,
            "weight_class": weight_class,
            "acoustic_character": acoustic,
        },
    )


def assign_case_id(index: int) -> str:
    return f"case-{index:03d}"


def build_case_stub_row(
    candidate: dict[str, Any],
    *,
    index: int,
    inventory_row: dict[str, Any] | None,
) -> dict[str, Any]:
    inv_id = str(candidate.get("id") or "").strip()
    name = str(candidate.get("productName") or candidate.get("normalizedName") or "").strip()
    brand = str(candidate.get("brand") or "").strip()
    inv = inventory_row or {}
    source_url = str(inv.get("sourceUrl") or inv.get("source_url") or "").strip()
    meta = infer_case_metadata(name, brand=brand)
    kit_type = str(meta.kit_type or "kit")
    tags = [t for t in (brand, kit_type, meta.layout_size or "") if t]
    return {
        "id": assign_case_id(index),
        "inventoryId": inv_id,
        "name": name,
        "category": "case",
        "subtype": kit_type,
        "sourceUrl": source_url,
        "metadata": meta.model_dump(exclude_none=True),
        "tags": tags,
    }


def validate_case_stub(row: dict[str, Any]) -> list[str]:
    metadata = row.get("metadata")
    if not isinstance(metadata, dict):
        return ["metadata must be an object"]
    try:
        meta = CaseMetadata.model_validate(metadata)
    except Exception as exc:  # noqa: BLE001
        return [str(exc)]
    traits = derive_case_traits(meta)
    if not traits:
        return ["trait derivation returned empty profile"]
    if all(abs(v - 5.0) < 1e-9 for v in traits.values()):
        return ["trait profile is flat — insufficient metadata"]
    if not str(row.get("name") or "").strip():
        return ["missing name"]
    if not str(row.get("id") or "").strip():
        return ["missing id"]
    return []


def load_case_kit_candidates(candidates_path: Path) -> list[dict[str, Any]]:
    payload = json.loads(candidates_path.read_text(encoding="utf-8"))
    rows = payload.get("candidates", {}).get("case_kit")
    if not isinstance(rows, list):
        return []
    return [r for r in rows if isinstance(r, dict)]


def load_inventory_index(inventory_path: Path) -> dict[str, dict[str, Any]]:
    payload = json.loads(inventory_path.read_text(encoding="utf-8"))
    items = payload.get("items")
    if not isinstance(items, list):
        return {}
    out: dict[str, dict[str, Any]] = {}
    for row in items:
        if isinstance(row, dict) and row.get("id"):
            out[str(row["id"])] = row
    return out


def merge_case_kits_into_seed(
    seed_payload: dict[str, Any],
    candidates_path: Path,
    inventory_path: Path,
) -> tuple[dict[str, Any], CaseSeedReport]:
    merged = json.loads(json.dumps(seed_payload))
    cases = merged.setdefault("cases", [])
    if not isinstance(cases, list):
        cases = []
        merged["cases"] = cases

    existing_inv_ids = {
        str(row.get("inventoryId") or "").strip()
        for row in cases
        if isinstance(row, dict) and str(row.get("inventoryId") or "").strip()
    }
    existing_case_ids = {str(row.get("id") or "").strip() for row in cases if isinstance(row, dict)}

    candidates = sorted(
        load_case_kit_candidates(candidates_path),
        key=lambda r: str(r.get("id") or ""),
    )
    inventory = load_inventory_index(inventory_path)
    report = CaseSeedReport(
        generated_at=datetime.now(UTC).isoformat(),
        candidate_count=len(candidates),
    )

    next_index = 1
    for row in cases:
        if not isinstance(row, dict):
            continue
        part_id = str(row.get("id") or "")
        m = re.match(r"case-(\d+)$", part_id)
        if m:
            next_index = max(next_index, int(m.group(1)) + 1)

    for candidate in candidates:
        inv_id = str(candidate.get("id") or "").strip()
        if inv_id in existing_inv_ids:
            report.skipped_existing += 1
            continue
        stub = build_case_stub_row(candidate, index=next_index, inventory_row=inventory.get(inv_id))
        issues = validate_case_stub(stub)
        if issues:
            report.rejected.append({"inventoryId": inv_id, "reason": "; ".join(issues)})
            continue
        while stub["id"] in existing_case_ids:
            next_index += 1
            stub["id"] = assign_case_id(next_index)
        cases.append(stub)
        existing_inv_ids.add(inv_id)
        existing_case_ids.add(stub["id"])
        report.added += 1
        next_index += 1

    return merged, report


def count_cases_in_seed(payload: dict[str, Any]) -> int:
    rows = payload.get("cases")
    return len(rows) if isinstance(rows, list) else 0
