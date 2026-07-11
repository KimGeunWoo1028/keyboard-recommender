"""Deterministic keyword → trait-axis hints for collection labels (no ML)."""

from __future__ import annotations

import re
from collections.abc import Mapping

# (pattern regex, trait hints). First match wins for a given axis contribution (summed later).
_KEYWORD_HINTS: tuple[tuple[re.Pattern[str], dict[str, float]], ...] = (
    (re.compile(r"저소음|조용|quiet|silent", re.I), {"muted": 0.05, "soft_bottom_out": 0.02}),
    (re.compile(r"muted|damp|감쇠", re.I), {"muted": 0.045}),
    (re.compile(r"택타일|tactile|걸림|청키", re.I), {"strong_tactile": 0.05, "scratchy": 0.015}),
    (re.compile(r"리니어|linear|매끈", re.I), {"smooth": 0.045}),
    (re.compile(r"사무|office|업무", re.I), {"muted": 0.03, "light_typing_force": 0.02}),
    (re.compile(r"게임|gaming", re.I), {"smooth": 0.02, "strong_tactile": 0.02}),
    (re.compile(r"thock|저음|묵직", re.I), {"deep_sound": 0.035, "muted": 0.015}),
    (re.compile(r"clacky|고음|밝", re.I), {"high_pitch": 0.03, "poppy": 0.02}),
    (re.compile(r"부드|소프트|soft", re.I), {"soft_bottom_out": 0.04}),
    (re.compile(r"단단|펌|firm", re.I), {"firm_bottom_out": 0.035}),
)


def trait_hints_from_collection_label(label: str) -> dict[str, float]:
    """Return merged axis hints for a human-readable collection name."""
    if not label or not str(label).strip():
        return {}
    text = str(label).strip()
    out: dict[str, float] = {}
    for rx, hints in _KEYWORD_HINTS:
        if not rx.search(text):
            continue
        for axis, mag in hints.items():
            out[axis] = out.get(axis, 0.0) + float(mag)
    return out


def merge_trait_hint_maps(base: dict[str, float], delta: Mapping[str, float], *, scale: float) -> None:
    for k, v in delta.items():
        base[k] = base.get(k, 0.0) + float(v) * scale
