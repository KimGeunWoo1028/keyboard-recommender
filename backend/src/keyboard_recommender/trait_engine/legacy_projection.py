"""
Project the 13-axis profile into the legacy 6-axis `userVector` used by older clients.

**Purpose**: keep API field `userVector` (deep_sound, clacky, …) populated without running
the deprecated v1 user-vector code path. Values are heuristic blends, not physical models.
"""

from __future__ import annotations


def legacy_six_axis_from_multi(v: dict[str, float]) -> dict[str, float]:
    return {
        "deep_sound": v["deep_sound"] + 0.25 * v["marbly"] + 0.15 * v["muted"],
        "clacky": v["high_pitch"] + 0.45 * v["scratchy"] + 0.35 * v["poppy"],
        "soft": v["soft_bottom_out"] + 0.35 * v["muted"] + 0.12 * v["smooth"],
        "firm": v["firm_bottom_out"] + 0.4 * v["stiff"] + 0.1 * v["scratchy"],
        "smooth": v["smooth"] + 0.12 * v["muted"] + 0.08 * v["flexible"],
        "tactile_strength": v["strong_tactile"] + 0.1 * v["scratchy"] - 0.05 * v["smooth"],
    }
