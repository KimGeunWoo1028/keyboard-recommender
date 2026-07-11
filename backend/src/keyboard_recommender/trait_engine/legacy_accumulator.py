"""Survey accumulation traits (camelCase API keys) for `legacyTraits` in API responses."""

from __future__ import annotations

from dataclasses import dataclass, fields

from keyboard_recommender.trait_engine.survey_deltas import option_delta


@dataclass
class TraitAccumulator:
    sound_muted: float = 0
    sound_bright: float = 0
    sound_thocky: float = 0
    sound_clacky: float = 0
    volume_quiet: float = 0
    volume_loud: float = 0
    linear_lean: float = 0
    tactile_lean: float = 0
    soft_bottom: float = 0
    firm_bottom: float = 0
    light_press: float = 0
    heavy_press: float = 0

    def to_api_dict(self) -> dict[str, float]:
        return {
            "soundMuted": self.sound_muted,
            "soundBright": self.sound_bright,
            "soundThocky": self.sound_thocky,
            "soundClacky": self.sound_clacky,
            "volumeQuiet": self.volume_quiet,
            "volumeLoud": self.volume_loud,
            "linearLean": self.linear_lean,
            "tactileLean": self.tactile_lean,
            "softBottom": self.soft_bottom,
            "firmBottom": self.firm_bottom,
            "lightPress": self.light_press,
            "heavyPress": self.heavy_press,
        }


def empty_traits() -> TraitAccumulator:
    return TraitAccumulator()


def add_trait_delta(base: TraitAccumulator, delta: dict[str, float]) -> TraitAccumulator:
    out = TraitAccumulator(**{f.name: getattr(base, f.name) for f in fields(TraitAccumulator)})
    for k, v in delta.items():
        attr = _camel_to_snake_attr(k)
        if hasattr(out, attr):
            setattr(out, attr, getattr(out, attr) + float(v))
    return out


def merge_deltas(deltas: list[dict[str, float]]) -> TraitAccumulator:
    acc = empty_traits()
    for d in deltas:
        acc = add_trait_delta(acc, d)
    return acc


def _camel_to_snake_attr(key: str) -> str:
    mapping = {
        "soundMuted": "sound_muted",
        "soundBright": "sound_bright",
        "soundThocky": "sound_thocky",
        "soundClacky": "sound_clacky",
        "volumeQuiet": "volume_quiet",
        "volumeLoud": "volume_loud",
        "linearLean": "linear_lean",
        "tactileLean": "tactile_lean",
        "softBottom": "soft_bottom",
        "firmBottom": "firm_bottom",
        "lightPress": "light_press",
        "heavyPress": "heavy_press",
    }
    return mapping.get(key, key)


def trait_from_survey_dict(d: dict[str, str]) -> TraitAccumulator:
    deltas: list[dict[str, float]] = []
    for step_id, answer_id in d.items():
        deltas.append(option_delta(str(step_id), str(answer_id)))
    return merge_deltas(deltas)
