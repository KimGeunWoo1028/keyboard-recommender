"""
Incremental fallback: if baseline build looks low-quality, re-score candidates with relaxed
compatibility influence on the *selection objective* (audit values stay truthful).
"""

from __future__ import annotations

from itertools import product

from keyboard_recommender.recommendation_quality.compatibility.penalties import evaluate_build_compatibility
from keyboard_recommender.recommendation_quality.compatibility.types import BuildCompatibilityAudit
from keyboard_recommender.recommendation_quality.config import QualityConfig
from keyboard_recommender.recommendation_quality.fallback.confidence import compute_build_confidence
from keyboard_recommender.recommendation_quality.fallback.replacement import selection_score
from keyboard_recommender.recommendation_quality.fallback.thresholds import collect_fallback_triggers
from keyboard_recommender.recommendation_quality.fallback.types import FallbackRecoveryAudit
from keyboard_recommender.recommendation_quality.intent.explicit_intent import ExplicitBuildIntent
from keyboard_recommender.trait_engine.matching import RankedPart

_BuildSext = tuple[RankedPart, RankedPart, RankedPart, RankedPart, RankedPart, RankedPart]


def _best_for_relax(
    candidates: list[tuple[_BuildSext, float, BuildCompatibilityAudit]],
    relax: float,
    penalty_strength: float,
) -> tuple[_BuildSext, BuildCompatibilityAudit, float]:
    best_sext: _BuildSext | None = None
    best_audit: BuildCompatibilityAudit | None = None
    best_sel = -1e18
    for sext, _rel, audit in candidates:
        rs, rp, rf, rl, rc, rk = sext
        sel = selection_score(
            rs,
            rp,
            rf,
            rl,
            rc,
            rk,
            audit,
            penalty_strength=penalty_strength,
            compatibility_relax_mult=relax,
        )
        if sel > best_sel:
            best_sel = sel
            best_sext = sext
            best_audit = audit
    assert best_sext is not None and best_audit is not None
    return best_sext, best_audit, best_sel


def select_build_with_fallback(
    sw: list[RankedPart],
    pl: list[RankedPart],
    fo: list[RankedPart],
    la: list[RankedPart],
    ca: list[RankedPart],
    kc: list[RankedPart],
    intent: ExplicitBuildIntent,
    *,
    cfg: QualityConfig,
) -> tuple[
    RankedPart,
    RankedPart,
    RankedPart,
    RankedPart,
    RankedPart,
    RankedPart,
    BuildCompatibilityAudit,
    FallbackRecoveryAudit,
]:
    fb = cfg.fallback
    candidates: list[tuple[_BuildSext, float, BuildCompatibilityAudit]] = []
    for rs, rp, rf, rl, rc, rk in product(sw, pl, fo, la, ca, kc):
        audit = evaluate_build_compatibility(
            rs.part, rp.part, rf.part, rl.part, rc.part, rk.part, intent, cfg,
        )
        rel = float(
            rs.raw_cosine + rp.raw_cosine + rf.raw_cosine + rl.raw_cosine + rc.raw_cosine + rk.raw_cosine
        )
        candidates.append(((rs, rp, rf, rl, rc, rk), rel, audit))

    if not candidates:
        msg = "recommendation_quality.fallback: empty candidate list"
        raise RuntimeError(msg)
    physically_valid = [row for row in candidates if not row[2].has_hard_incompatibility]
    search_space = physically_valid if physically_valid else candidates

    relax_steps = (1.0, *tuple(fb.relax_compatibility_steps))
    div_factors = (1.0, *tuple(fb.diversity_strength_relax_factors))
    n = max(len(relax_steps), len(div_factors))
    relax_list = list(relax_steps) + [relax_steps[-1]] * max(0, n - len(relax_steps))
    div_list = list(div_factors) + [div_factors[-1]] * max(0, n - len(div_factors))

    sext0, audit0, _s0 = _best_for_relax(search_space, relax_list[0], cfg.penalty_strength)
    rs0, rp0, rf0, rl0, rc0, rk0 = sext0
    conf0 = compute_build_confidence(
        rs0, rp0, rf0, rl0, rc0, rk0, audit0, None, cfg=cfg, fallback_tier=0,
    )
    triggers0 = collect_fallback_triggers(rs0, rp0, rf0, rl0, rc0, rk0, audit0, conf0, cfg=cfg)

    if not fb.enabled:
        audit_fb = FallbackRecoveryAudit(
            recovered=False,
            tier=0,
            compatibility_relax_mult=1.0,
            diversity_strength_mult=1.0,
            triggers=triggers0,
            confidence_before=round(conf0.overall, 4),
            confidence_after=round(conf0.overall, 4),
            overall_label=conf0.label,
            notes=("fallback_hook:disabled",),
        )
        return rs0, rp0, rf0, rl0, rc0, rk0, audit0, audit_fb

    if not triggers0:
        audit_fb = FallbackRecoveryAudit(
            recovered=False,
            tier=0,
            compatibility_relax_mult=1.0,
            diversity_strength_mult=1.0,
            triggers=(),
            confidence_before=round(conf0.overall, 4),
            confidence_after=round(conf0.overall, 4),
            overall_label=conf0.label,
            notes=("fallback_hook:quality_accepted",),
        )
        return rs0, rp0, rf0, rl0, rc0, rk0, audit0, audit_fb

    chosen_sext = sext0
    chosen_audit = audit0
    chosen_relax = relax_list[0]
    chosen_tier = 0
    chosen_div_mult = div_list[0]
    conf_before = conf0.overall

    for i in range(1, len(relax_list)):
        relax_mult = relax_list[i]
        sext_i, audit_i, _sel_i = _best_for_relax(search_space, relax_mult, cfg.penalty_strength)
        rsi, rpi, rfi, rli, rci, rki = sext_i
        conf_i = compute_build_confidence(
            rsi, rpi, rfi, rli, rci, rki, audit_i, None, cfg=cfg, fallback_tier=0,
        )
        triggers_i = collect_fallback_triggers(rsi, rpi, rfi, rli, rci, rki, audit_i, conf_i, cfg=cfg)
        chosen_sext = sext_i
        chosen_audit = audit_i
        chosen_relax = relax_mult
        chosen_tier = i
        chosen_div_mult = div_list[min(i, len(div_list) - 1)]
        if not triggers_i:
            break
        if conf_i.overall >= fb.min_overall_confidence + 0.04:
            break

    rs, rp, rf, rl, rc, rk = chosen_sext
    conf_after_gate = compute_build_confidence(
        rs, rp, rf, rl, rc, rk, chosen_audit, None, cfg=cfg, fallback_tier=0,
    )
    notes_list = [
        "fallback_hook:compatibility_relax_for_selection",
        f"fallback_note:compat_relax_mult={chosen_relax:.3f}",
        f"fallback_note:diversity_strength_mult={chosen_div_mult:.3f}",
    ]
    if chosen_tier > 0:
        notes_list.append("fallback_explain:balanced_alternative_candidate_space")

    audit_fb = FallbackRecoveryAudit(
        recovered=chosen_tier > 0,
        tier=chosen_tier,
        compatibility_relax_mult=chosen_relax,
        diversity_strength_mult=chosen_div_mult,
        triggers=collect_fallback_triggers(rs, rp, rf, rl, rc, rk, chosen_audit, conf_after_gate, cfg=cfg),
        confidence_before=round(conf_before, 4),
        confidence_after=round(conf_after_gate.overall, 4),
        overall_label=conf_after_gate.label,
        notes=tuple(notes_list),
    )
    return rs, rp, rf, rl, rc, rk, chosen_audit, audit_fb
