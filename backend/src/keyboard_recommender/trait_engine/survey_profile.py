"""
Survey answers → multi-dimensional user trait scores (rule-based baseline).

This replaces the *old* 6-axis `user_vector` derivation for the v2 engine only.
Rules are explicit and auditable — swap for ML later by implementing the same output shape.
"""

from __future__ import annotations

from keyboard_recommender.trait_engine.vectors import add_scaled, empty_vector


def survey_answers_to_trait_scores(answers: dict[str, str]) -> dict[str, float]:
    """
    Fold structured survey into the v2 axis space.

    **Design choice**: additive boosts per answer dimension (not a trained model).
    Magnitudes are ~0–6 so catalog items on 0–10 stay comparable before weighting.
    """
    v = empty_vector()

    sp = answers.get("sound_profile", "")
    if sp == "thocky":
        v = add_scaled(v, {"deep_sound": 5, "muted": 1, "high_pitch": -1, "marbly": 2})
    elif sp == "clacky":
        v = add_scaled(v, {"high_pitch": 5, "scratchy": 4, "poppy": 3, "deep_sound": 1})
    elif sp == "muted":
        # Stronger muted / lower pitch — aligns with PBT dye-sub keycap traits (Phase E).
        v = add_scaled(v, {"muted": 6, "high_pitch": -2.5, "soft_bottom_out": 2, "deep_sound": 1})
    elif sp == "balanced":
        v = add_scaled(v, {"deep_sound": 2, "high_pitch": 2, "smooth": 2, "muted": 1})
    elif sp == "bright":
        # Brighter / poppier — aligns with ABS doubleshot keycap traits (Phase E).
        v = add_scaled(v, {"high_pitch": 5, "poppy": 3, "scratchy": 2, "deep_sound": 0.5, "muted": -1})

    tp = answers.get("typing_pressure", "")
    if tp == "light":
        v = add_scaled(v, {"light_typing_force": 4, "soft_bottom_out": 1})
    elif tp == "heavy":
        v = add_scaled(v, {"firm_bottom_out": 3, "stiff": 2, "light_typing_force": -1})
    else:
        v = add_scaled(v, {"light_typing_force": 1, "firm_bottom_out": 1})

    sf = answers.get("switch_feel", "")
    if sf == "linear":
        v = add_scaled(v, {"smooth": 5, "strong_tactile": -2})
    elif sf == "tactile_light":
        v = add_scaled(v, {"strong_tactile": 2, "smooth": 2})
    elif sf == "tactile_clear":
        v = add_scaled(v, {"strong_tactile": 5, "scratchy": 1})

    bo = answers.get("bottom_out", "")
    if bo == "soft":
        v = add_scaled(v, {"soft_bottom_out": 5, "firm_bottom_out": -1})
    elif bo == "firm":
        v = add_scaled(v, {"firm_bottom_out": 4, "stiff": 2, "soft_bottom_out": -1})
    else:
        v = add_scaled(v, {"soft_bottom_out": 1, "firm_bottom_out": 1})

    vol = answers.get("volume", "")
    if vol == "quiet":
        v = add_scaled(v, {"muted": 4, "high_pitch": -1.5, "deep_sound": 0.5})
    elif vol == "loud":
        v = add_scaled(v, {"high_pitch": 2.5, "scratchy": 1, "poppy": 1, "muted": -1.5})
    else:
        v = add_scaled(v, {"muted": 1})

    return v
