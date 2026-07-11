"""Typed catalog rows for the trait engine."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping


@dataclass(frozen=True)
class KeyboardPart:
    """Any recommendable component with a dense trait profile on `TRAIT_AXIS_IDS`."""

    id: str
    name: str
    description: str
    family: str  # "switch" | "plate" | "foam" | "layout"
    traits: Mapping[str, float]
    popularity_weight: float = 1.0
    metadata: Mapping[str, Any] | None = None
