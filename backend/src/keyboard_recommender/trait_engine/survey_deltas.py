"""Per-option legacy trait deltas — keep in sync with `frontend/src/lib/survey-definition.ts`."""

from __future__ import annotations

# (step_id, option_id) -> delta dict (camelCase keys matching frontend)
SURVEY_OPTION_DELTAS: dict[tuple[str, str], dict[str, float]] = {
    ("sound_profile", "thocky"): {"soundThocky": 3, "soundMuted": 1, "soundBright": -1},
    ("sound_profile", "clacky"): {"soundClacky": 3, "soundBright": 2, "soundMuted": -1},
    ("sound_profile", "muted"): {"soundMuted": 4, "volumeQuiet": 2, "soundBright": -2},
    ("sound_profile", "balanced"): {"soundThocky": 1, "soundClacky": 1, "soundMuted": 1},
    ("sound_profile", "bright"): {"soundBright": 4, "soundClacky": 2, "soundMuted": -2},
    ("typing_pressure", "light"): {"lightPress": 3, "softBottom": 1, "firmBottom": -1},
    ("typing_pressure", "medium"): {"lightPress": 1, "heavyPress": 1},
    ("typing_pressure", "heavy"): {"heavyPress": 3, "firmBottom": 2, "softBottom": -1},
    ("switch_feel", "tactile_clear"): {"tactileLean": 3, "linearLean": -1},
    ("switch_feel", "tactile_light"): {"tactileLean": 2, "linearLean": 0},
    ("switch_feel", "linear"): {"linearLean": 3, "tactileLean": -1},
    ("bottom_out", "soft"): {"softBottom": 3, "firmBottom": -1, "soundMuted": 1},
    ("bottom_out", "medium"): {"softBottom": 1, "firmBottom": 1},
    ("bottom_out", "firm"): {"firmBottom": 3, "softBottom": -1, "soundBright": 1},
    ("volume", "quiet"): {"volumeQuiet": 3, "soundMuted": 2, "soundBright": -1},
    ("volume", "moderate"): {"volumeQuiet": 1, "volumeLoud": 1},
    ("volume", "loud"): {"volumeLoud": 3, "soundBright": 1, "soundMuted": -1},
}

REQUIRED_STEPS = (
    "sound_profile",
    "typing_pressure",
    "switch_feel",
    "bottom_out",
    "volume",
)


def option_delta(step_id: str, answer_id: str) -> dict[str, float]:
    return dict(SURVEY_OPTION_DELTAS.get((step_id, answer_id), {}))


def is_complete_answers(data: dict[str, str]) -> bool:
    return all(step in data and data[step] for step in REQUIRED_STEPS)
