"""Small bounded trait-vector shifts (shared by ranker + API envelope)."""


def apply_trait_nudges(base: dict[str, float], nudges: dict[str, float] | None) -> dict[str, float]:
    if not nudges:
        return base
    out = dict(base)
    for axis, delta in nudges.items():
        if axis not in out:
            continue
        out[axis] = max(-4.0, min(12.0, float(out[axis]) + float(delta)))
    return out
