"""Static layout archetype diagram paths (served from frontend /public/layout-diagrams)."""

from __future__ import annotations

import re

_LAYOUT_ARCHETYPE_ID_RE = re.compile(r"^layout-\d{3}$")

_LAYOUT_DIAGRAM_BY_ID: dict[str, str] = {
    "layout-001": "/layout-diagrams/60-standard.svg",
    "layout-002": "/layout-diagrams/65-compact.svg",
    "layout-003": "/layout-diagrams/tkl.svg",
    "layout-004": "/layout-diagrams/full-size.svg",
    "layout-005": "/layout-diagrams/75-exploded.svg",
    "layout-006": "/layout-diagrams/alice.svg",
    "layout-007": "/layout-diagrams/split-60.svg",
}


def is_layout_archetype_part_id(part_id: str) -> bool:
    return bool(_LAYOUT_ARCHETYPE_ID_RE.match(str(part_id or "").strip()))


def resolve_layout_archetype_diagram_url(part_id: str) -> str:
    """Return frontend-static SVG path for layout-001…007; empty for unknown ids."""
    needle = str(part_id or "").strip()
    if not is_layout_archetype_part_id(needle):
        return ""
    return _LAYOUT_DIAGRAM_BY_ID.get(needle, "")
