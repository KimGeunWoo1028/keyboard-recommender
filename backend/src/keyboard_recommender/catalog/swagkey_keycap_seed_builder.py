"""Build curated keycap seed rows from full catalog candidates (roadmap ⑭)."""

from __future__ import annotations

import re
from typing import Any, Literal

from keyboard_recommender.catalog.metadata_mapping import derive_keycap_traits
from keyboard_recommender.catalog.metadata_models import KeycapMetadata
from keyboard_recommender.catalog.swagkey_source_url import normalize_product_detail_url

Profile = Literal["cherry", "oem", "asa", "sa", "xda", "dsa", "mt3", "moa", "crp", "kat", "other"]
Material = Literal["ABS", "PBT", "other"]
Manufacturing = Literal["doubleshot", "dye_sub", "double_shot_pbt", "other"]
KitScope = Literal["base", "noveset", "alpha", "mod", "addon", "full"]
LayoutSize = Literal["40", "60", "65", "75", "80_tkl", "96", "full", "alice", "split"]

# Curated base kits for recommendation pool (not Add-on / Alpha / Accents).
# Phase E (2026-07-10): 12 → 18 — only rows with shop_view/?idx= + non-flat traits.
CURATED_FULL_CATALOG_IDS: tuple[str, ...] = (
    "full-005",  # SWG Midnight Rainbow ABS doubleshot
    "full-006",  # GMK CYL Pandemonium
    "full-008",  # SWG Rubber ABS doubleshot
    "full-009",  # Calm Beige PBT dye-sub
    "full-012",  # SWG Euler ABS doubleshot
    "full-016",  # MOA
    "full-017",  # BoB 65%
    "full-018",  # DoodleCaps PBT dye-sub
    "full-046",  # CRP R7 Base
    "full-051",  # GMK CYL Foundation R2
    "full-065",  # GMK CYL Gonzales
    "full-066",  # SWG Beige ABS Base
    # Phase E expansion
    "full-013",  # Calm Beige PBT dye-sub (novelties variant) — muted/PBT
    "full-023",  # SWG Classic Red ABS doubleshot
    "full-026",  # SWG Rainbow Alert ABS doubleshot — colorful
    "full-027",  # GMK CYL Thunder God
    "full-030",  # SWG Classic Blue ABS doubleshot
    "full-050",  # GMK MTNU Foundation R2 — cherry/MTNU profile
)


def infer_profile(name: str) -> Profile:
    n = name.lower()
    if "cyl" in n or "gmk" in n or "cherry" in n:
        return "cherry"
    if "crp" in n:
        return "crp"
    if "moa" in n:
        return "moa"
    if "mtnu" in n or "mt3" in n:
        return "mt3"
    if re.search(r"\bkat\b|\bkap\b", n):
        return "kat"
    if "asa" in n:
        return "asa"
    if "xda" in n:
        return "xda"
    if "dsa" in n:
        return "dsa"
    if "sa" in n and "asa" not in n:
        return "sa"
    return "oem"


def infer_material(name: str) -> Material:
    n = name.lower()
    if "pbt" in n:
        return "PBT"
    if "abs" in n:
        return "ABS"
    if "gmk" in n or "cyl" in n:
        return "ABS"
    if "염료승화" in n or "dye" in n:
        return "PBT"
    return "other"


def infer_manufacturing(name: str, material: Material) -> Manufacturing:
    n = name.lower()
    if "이중사출" in n or "doubleshot" in n or "double-shot" in n:
        return "double_shot_pbt" if material == "PBT" else "doubleshot"
    if "염료승화" in n or "dye" in n:
        return "dye_sub"
    if material == "ABS":
        return "doubleshot"
    if material == "PBT":
        return "dye_sub"
    return "other"


def infer_kit_scope(name: str) -> KitScope:
    n = name.lower()
    if "add-on" in n or "addon" in n or "add on" in n:
        return "addon"
    if "accent" in n:
        return "addon"
    if "alpha" in n:
        return "alpha"
    if re.search(r"\bmod\b", n) and "base" not in n:
        return "mod"
    if "novelt" in n:
        return "noveset"
    if "base" in n or "베이스" in n:
        return "base"
    return "base"


def infer_layout_sizes(name: str) -> list[LayoutSize]:
    n = name.lower()
    sizes: list[LayoutSize] = []
    if "65%" in n or re.search(r"\b65\b", n):
        sizes.append("65")
    if "60%" in n or re.search(r"\b60\b", n):
        sizes.append("60")
    if "75%" in n or re.search(r"\b75\b", n):
        sizes.append("75")
    if "tkl" in n or "80%" in n:
        sizes.append("80_tkl")
    if "40%" in n or re.search(r"\b40\b", n):
        sizes.append("40")
    return sizes


def infer_colorway_mood(name: str) -> Literal["dark", "light", "colorful", "neutral"]:
    n = name.lower()
    if any(tok in n for tok in ("rainbow", "alert", "color", "rgb", "컬러")):
        return "colorful"
    if any(tok in n for tok in ("black", "noir", "dark", "흑", "블랙", "bob")):
        return "dark"
    if any(tok in n for tok in ("beige", "white", "cream", "ivory", "베이지", "화이트", "calm")):
        return "light"
    return "neutral"


def infer_keycap_metadata(name: str) -> KeycapMetadata:
    material = infer_material(name)
    return KeycapMetadata(
        profile=infer_profile(name),
        material=material,
        manufacturing=infer_manufacturing(name, material),
        kit_scope=infer_kit_scope(name),
        compatible_layout_sizes=infer_layout_sizes(name),
        colorway_mood=infer_colorway_mood(name),
    )


def validate_keycap_stub(meta: KeycapMetadata) -> list[str]:
    errors: list[str] = []
    traits = derive_keycap_traits(meta)
    if all(abs(float(v) - 5.0) < 1e-9 for v in traits.values()):
        errors.append("traits_are_flat_centered")
    if not meta.material and not meta.profile:
        errors.append("missing_material_and_profile")
    return errors


def build_keycap_seed_row(
    full_row: dict[str, Any],
    *,
    seed_id: str,
) -> dict[str, Any]:
    name = str(full_row.get("name") or "").strip()
    meta = infer_keycap_metadata(name)
    errs = validate_keycap_stub(meta)
    if errs:
        raise ValueError(f"invalid keycap stub {seed_id}: {errs}")
    raw_url = str(full_row.get("sourceUrl") or "").strip()
    source_url = normalize_product_detail_url(raw_url) or raw_url
    if "idx=" not in source_url:
        raise ValueError(f"keycap {seed_id} missing product idx URL: {source_url}")
    return {
        "id": seed_id,
        "name": name,
        "brand": str(full_row.get("brand") or ""),
        "subtype": str(meta.kit_scope or "base"),
        "sourceUrl": source_url,
        "inventoryId": str(full_row.get("inventoryId") or ""),
        "fullCatalogId": str(full_row.get("id") or ""),
        "inRecommendationPool": True,
        "metadata": meta.model_dump(exclude_none=True),
    }


def build_curated_keycap_seed(
    full_catalog_items: list[dict[str, Any]],
    *,
    curated_ids: tuple[str, ...] = CURATED_FULL_CATALOG_IDS,
) -> list[dict[str, Any]]:
    by_id = {str(r.get("id") or ""): r for r in full_catalog_items if isinstance(r, dict)}
    out: list[dict[str, Any]] = []
    for idx, full_id in enumerate(curated_ids, start=1):
        row = by_id.get(full_id)
        if row is None:
            raise KeyError(f"curated keycap missing from full catalog: {full_id}")
        out.append(build_keycap_seed_row(row, seed_id=f"kc-{idx:03d}"))
    return out
