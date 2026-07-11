"""Swagkey component spec extraction helpers."""

from __future__ import annotations

import html as html_lib
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen


_TAG_RE = re.compile(r"<[^>]+>")
_SPACE_RE = re.compile(r"\s+")
_NUM_RE = re.compile(r"-?\d+(?:\.\d+)?")


@dataclass(slots=True)
class ScrapeTarget:
    id: str
    url: str
    name: str = ""


def fetch_html(url: str, *, timeout_s: float = 20.0) -> str:
    req = Request(
        url=url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        },
    )
    with urlopen(req, timeout=timeout_s) as resp:  # noqa: S310 - controlled URL input for CLI tool
        data = resp.read()
    return data.decode("utf-8", errors="ignore")


def html_to_text(document: str) -> str:
    body = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", document)
    body = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", body)
    body = _TAG_RE.sub(" ", body)
    body = html_lib.unescape(body)
    return _SPACE_RE.sub(" ", body).strip()


def _parse_float(value: str) -> float | None:
    m = _NUM_RE.search(value)
    if not m:
        return None
    try:
        return float(m.group(0))
    except ValueError:
        return None


def _extract_first(patterns: list[str], text: str) -> float | None:
    for p in patterns:
        m = re.search(p, text, flags=re.I)
        if not m:
            continue
        val = _parse_float(m.group(1))
        if val is not None:
            return val
    return None


def _extract_material(patterns: list[str], text: str) -> str | None:
    for p in patterns:
        m = re.search(p, text, flags=re.I)
        if m:
            return m.group(1).strip().upper()
    return None


def _detect_tags(text: str) -> list[str]:
    lowered = text.lower()
    out: list[str] = []
    checks = [
        ("silent", ["저소음", "무소음", "silent"]),
        ("thocky", ["thock", "도각", "묵직", "저음"]),
        ("clacky", ["clack", "클랙", "고음", "팝"]),
        ("creamy", ["cream", "크리미", "보글"]),
        ("poppy", ["poppy", "팝피", "통통"]),
        ("fast", ["빠른", "신속", "speed", "rapid"]),
        ("tactile", ["택타일", "촉각", "tactile"]),
        ("linear", ["리니어", "linear"]),
        ("click", ["클릭", "click"]),
        ("magnetic", ["마그네틱", "자석", "he"]),
    ]
    for tag, needles in checks:
        if any(n in lowered for n in needles):
            out.append(tag)
    return out


def parse_switch_spec_from_text(text: str, *, fallback_name: str = "") -> dict[str, Any]:
    source = f"{fallback_name} {text}".strip()
    out: dict[str, Any] = {}

    spring_weight = _extract_first(
        [
            r"(?:스프링\s*압|키압|작동압|actuation force)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*g",
            r"(?:spring)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*g",
        ],
        source,
    )
    bottom_out = _extract_first(
        [
            r"(?:바닥압|바텀아웃|bottom[\s_-]*out(?: force)?)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*g",
        ],
        source,
    )
    travel = _extract_first(
        [
            r"(?:총\s*트래블|트래블|travel|total travel)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*mm",
        ],
        source,
    )
    pretravel = _extract_first(
        [
            r"(?:입력\s*지점|작동\s*거리|pre[\s_-]*travel|actuation)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*mm",
        ],
        source,
    )
    if spring_weight is not None:
        out["spring_weight_g"] = spring_weight
    if bottom_out is not None:
        out["bottom_out_force_g"] = bottom_out
    if travel is not None:
        out["travel_distance_mm"] = travel
    if pretravel is not None:
        out["pretravel_mm"] = pretravel

    lower = source.lower()
    if "롱폴" in source or "long pole" in lower:
        out["long_pole"] = True
    if "factory lubed" in lower or "윤활" in source:
        out["factory_lubed"] = "비윤활" not in source and "unlubed" not in lower

    if "2단" in source or "dual stage" in lower:
        out["spring_type"] = "dual_stage"
    elif "슬로우" in source or "slow" in lower:
        out["spring_type"] = "slow"
    elif "progressive" in lower:
        out["spring_type"] = "progressive"

    material_value = r"([A-Za-z0-9-]+(?:\s*/\s*[A-Za-z0-9-]+)?)"
    top = _extract_material([rf"(?:top housing|상부\s*하우징)\s*[:：]?\s*{material_value}"], source)
    bottom = _extract_material([rf"(?:bottom housing|하부\s*하우징)\s*[:：]?\s*{material_value}"], source)
    stem = _extract_material([rf"(?:stem|스템)\s*[:：]?\s*{material_value}"], source)
    if top:
        out["housing_material_top"] = top
    if bottom:
        out["housing_material_bottom"] = bottom
    if stem:
        out["stem_material"] = stem

    tags = _detect_tags(source)
    if tags:
        out["sound_signature_tags"] = sorted(set(tags))
    return out


def parse_switch_spec_from_html(document: str, *, fallback_name: str = "") -> dict[str, Any]:
    text = html_to_text(document)
    return parse_switch_spec_from_text(text, fallback_name=fallback_name)


def _extract_size_tags(source: str) -> list[str]:
    lowered = source.lower()
    out: list[str] = []
    checks = [
        ("40", ["40%", "40 layout", "40배열"]),
        ("60", ["60%", "60 layout", "60배열"]),
        ("65", ["65%", "65 layout", "65배열"]),
        ("75", ["75%", "75 layout", "75배열"]),
        ("80_tkl", ["tkl", "80%", "80 layout"]),
        ("96", ["96%", "98%", "96 layout", "98 layout"]),
        ("full", ["full", "100%", "풀배열"]),
        ("alice", ["alice", "앨리스"]),
        ("split", ["split", "스플릿"]),
    ]
    for key, needles in checks:
        if any(n in lowered for n in needles):
            out.append(key)
    return sorted(set(out))


def parse_plate_spec_from_text(text: str, *, fallback_name: str = "") -> dict[str, Any]:
    source = f"{fallback_name} {text}".strip()
    lowered = source.lower()
    out: dict[str, Any] = {}
    if "fr4" in lowered:
        out["material"] = "FR4"
    elif "aluminum" in lowered or "알루" in source:
        out["material"] = "Aluminum"
    elif "pom" in lowered:
        out["material"] = "POM"
    elif "pc" in lowered or "polycarbonate" in lowered:
        out["material"] = "PC"
    elif "brass" in lowered:
        out["material"] = "Brass"

    flex = _extract_first([r"(?:flex|플렉스)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)"], source)
    if flex is not None:
        out["flex_rating"] = max(1, min(10, int(round(flex))))

    if "gasket" in lowered:
        out["mounting_bias"] = "gasket"
    elif "top mount" in lowered or "탑마운트" in source:
        out["mounting_bias"] = "top"
    elif "tray" in lowered:
        out["mounting_bias"] = "tray"
    elif "leaf spring" in lowered:
        out["mounting_bias"] = "leaf_spring"
    elif "sandwich" in lowered:
        out["mounting_bias"] = "sandwich"

    sizes = _extract_size_tags(source)
    if sizes:
        out["compatible_layout_sizes"] = sizes
    standards: list[str] = []
    if "ansi" in lowered:
        standards.append("ansi")
    if "iso" in lowered:
        standards.append("iso")
    if standards:
        out["compatible_standards"] = sorted(set(standards))
    if "blocker" in lowered or "winkeyless" in lowered or "wkl" in lowered:
        out["supports_blockers"] = True
    if "exploded" in lowered:
        out["supports_exploded"] = True
    if "mounting_bias" in out:
        out["mounting_support"] = [str(out["mounting_bias"])]
    return out


def parse_plate_spec_from_html(document: str, *, fallback_name: str = "") -> dict[str, Any]:
    return parse_plate_spec_from_text(html_to_text(document), fallback_name=fallback_name)


def parse_foam_spec_from_text(text: str, *, fallback_name: str = "") -> dict[str, Any]:
    source = f"{fallback_name} {text}".strip()
    lowered = source.lower()
    out: dict[str, Any] = {}
    damp = _extract_first(
        [r"(?:dampening|감쇠|흡음)\s*(?:strength|강도)?\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)"],
        source,
    )
    if damp is not None:
        out["dampening_strength"] = max(1, min(10, int(round(damp))))
    elif "epdm" in lowered:
        out["dampening_strength"] = 9
    elif "thinsul" in lowered:
        out["dampening_strength"] = 7

    if "firm" in lowered or "단단" in source:
        out["compression_character"] = "firm"
    elif "soft" in lowered or "부드" in source:
        out["compression_character"] = "soft"
    elif "balanced" in lowered or "중간" in source:
        out["compression_character"] = "balanced"

    if "spacebar" in lowered or "스페이스바" in source:
        out["placement_type"] = "spacebar"
    elif "plate" in lowered or "기보강" in source:
        out["placement_type"] = "plate"
    elif "switch" in lowered:
        out["placement_type"] = "switch"
    elif "full stack" in lowered:
        out["placement_type"] = "fullstack"
    elif "case" in lowered or "하부" in source:
        out["placement_type"] = "case"

    sizes = _extract_size_tags(source)
    if sizes:
        out["compatible_layout_sizes"] = sizes

    mounts: list[str] = []
    if "gasket" in lowered:
        mounts.append("gasket")
    if "top mount" in lowered or "탑마운트" in source:
        mounts.append("top")
    if "tray" in lowered:
        mounts.append("tray")
    if "leaf spring" in lowered:
        mounts.append("leaf_spring")
    if "sandwich" in lowered:
        mounts.append("sandwich")
    if mounts:
        out["mounting_compatibility"] = sorted(set(mounts))

    if "tactile preserve" in lowered or "택타일 유지" in source:
        out["tactile_preservation"] = "high"
    elif out.get("dampening_strength", 0) >= 8:
        out["tactile_preservation"] = "low"
    elif out.get("dampening_strength", 0) >= 6:
        out["tactile_preservation"] = "medium"
    return out


def parse_foam_spec_from_html(document: str, *, fallback_name: str = "") -> dict[str, Any]:
    return parse_foam_spec_from_text(html_to_text(document), fallback_name=fallback_name)


def load_targets(path: Path) -> list[ScrapeTarget]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    rows = payload.get("switches")
    if not isinstance(rows, list):
        raise ValueError("targets JSON must contain `switches` list")
    out: list[ScrapeTarget] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        sid = str(row.get("id") or "").strip()
        url = str(row.get("url") or "").strip()
        name = str(row.get("name") or "").strip()
        if not sid or not url:
            continue
        out.append(ScrapeTarget(id=sid, url=url, name=name))
    return out


def load_component_targets(path: Path, family_key: str) -> list[ScrapeTarget]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    rows = payload.get(family_key)
    if not isinstance(rows, list):
        return []
    out: list[ScrapeTarget] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        sid = str(row.get("id") or "").strip()
        url = str(row.get("url") or "").strip()
        name = str(row.get("name") or "").strip()
        if not sid or not url:
            continue
        out.append(ScrapeTarget(id=sid, url=url, name=name))
    return out

