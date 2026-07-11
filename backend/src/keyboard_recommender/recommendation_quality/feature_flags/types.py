from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class OperationalFeatureFlags:
    """Runtime-operational toggles; defaults are safe and reversible."""

    enable_reranking: bool = True
    enable_fallback: bool = True
    enable_feedback_weighting: bool = True
    model_version: str = "stable_v2"
