"""Translate raw counters into bounded multipliers + small axis nudges (explainable)."""

from __future__ import annotations

from keyboard_recommender.recommendation_quality.feedback_learning.config import FeedbackLearningMvpConfig
from keyboard_recommender.recommendation_quality.feedback_learning.types import LearningAdjustments, PersonalizationMetrics
from keyboard_recommender.recommendation_quality.popularity_tracker.aggregates import RawInteractionSignals

_FAMILY_AXIS_WEIGHT_HINTS: dict[str, dict[str, float]] = {
    "linear": {"smooth": 0.06, "strong_tactile": -0.03},
    "tactile": {"strong_tactile": 0.06, "scratchy": 0.02},
    "clicky": {"high_pitch": 0.05, "poppy": 0.04},
    "silent": {"muted": 0.06, "soft_bottom_out": 0.03},
}


def _clamp_mult(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def _l1(d: dict[str, float]) -> float:
    return sum(abs(v) for v in d.values())


def compile_learning_adjustments(raw: RawInteractionSignals, cfg: FeedbackLearningMvpConfig) -> LearningAdjustments:
    lines: list[str] = []
    mult: dict[str, float] = {}

    acc_boost = cfg.save_score_delta
    if cfg.acceptance_extra_boost > 0 and raw.acceptance_events > 0:
        acc_boost += cfg.acceptance_extra_boost * min(1.0, raw.acceptance_events / 5.0)

    for pid, c in raw.part_clicks.items():
        mult[pid] = mult.get(pid, 1.0) + c * cfg.click_score_delta
    for pid, s in raw.part_saves.items():
        mult[pid] = mult.get(pid, 1.0) + s * acc_boost
    for pid, d in raw.part_dislikes.items():
        pen = cfg.dislike_score_delta
        if cfg.rejection_extra_penalty > 0 and raw.rejection_events > 0:
            pen += cfg.rejection_extra_penalty * min(1.0, raw.rejection_events / 5.0)
        mult[pid] = mult.get(pid, 1.0) - d * pen

    for pid, m in list(mult.items()):
        mult[pid] = _clamp_mult(m, cfg.min_part_multiplier, cfg.max_part_multiplier)
        if abs(mult[pid] - 1.0) > 1e-6:
            lines.append(f"실사용 신호 가중: `{pid}` 점수 배율 {mult[pid]:.3f} (상·하한 적용).")

    trait_nudges: dict[str, float] = {}
    for fam, c in raw.family_clicks.items():
        hints = _FAMILY_AXIS_WEIGHT_HINTS.get(fam)
        if not hints:
            continue
        scale = min(c * cfg.family_click_axis_scale, cfg.max_trait_nudge_per_axis)
        if scale <= 0:
            continue
        lines.append(
            f"스위치 계열 '{fam}' 클릭 누적(시간 가중)에 따라 미세 축 힌트 적용(스케일 {scale:.3f}).",
        )
        for axis, hint in hints.items():
            trait_nudges[axis] = trait_nudges.get(axis, 0.0) + hint * scale

    hint_scale = cfg.collection_hint_scale
    for axis, mag in raw.trait_hints.items():
        trait_nudges[axis] = trait_nudges.get(axis, 0.0) + mag * hint_scale

    gate = 1.0
    if raw.weighted_mass < cfg.min_weighted_mass_for_trait_hints:
        gate = raw.weighted_mass / max(cfg.min_weighted_mass_for_trait_hints, 1e-9)
        lines.append(
            f"상호작용 가중 질량 {raw.weighted_mass:.2f}이 기준({cfg.min_weighted_mass_for_trait_hints:.2f}) 미만이라 "
            f"취향 축 힌트를 {gate * 100:.0f}%만 반영했습니다(희소 행동 과적합 방지).",
        )
    gated_trait = gate < 0.999

    for axis, total in list(trait_nudges.items()):
        trait_nudges[axis] = _clamp_mult(
            total * gate,
            -cfg.max_trait_nudge_per_axis,
            cfg.max_trait_nudge_per_axis,
        )

    tactile_clicks = raw.family_clicks.get("tactile", 0.0)
    if (
        raw.comparison_pairs >= cfg.tactile_uncertainty_min_comparisons
        and tactile_clicks >= cfg.tactile_uncertainty_min_family_clicks
    ):
        mag = cfg.tactile_uncertainty_nudge
        trait_nudges["strong_tactile"] = trait_nudges.get("strong_tactile", 0.0) - mag
        trait_nudges["smooth"] = trait_nudges.get("smooth", 0.0) + mag * 0.55
        lines.append(
            "반복 비교와 촉각 계열 탐색이 있어 촉각 축 불확실성을 소폭 반영(강한 촉각 고정 완화).",
        )
        for axis in list(trait_nudges.keys()):
            trait_nudges[axis] = _clamp_mult(
                trait_nudges[axis],
                -cfg.max_trait_nudge_per_axis,
                cfg.max_trait_nudge_per_axis,
            )

    if raw.collection_tag_events > 1e-6:
        lines.append(
            "저장·태그 컬렉션 라벨 키워드(저소음/촉각 등)로 축 힌트를 소폭 보강했습니다.",
        )
    if raw.revisit_events > 1e-6:
        lines.append("결과 재방문 신호를 반영했습니다.")
    if raw.refinement_events > 1e-6:
        lines.append("설문 정교화 횟수를 다양성/취향 보정에 반영했습니다.")

    w_switch: dict[str, float] = {}
    for axis, delta in trait_nudges.items():
        w_switch[axis] = w_switch.get(axis, 0.0) + delta * 0.35

    div_from_comp = raw.comparison_pairs * cfg.diversity_strength_per_comparison_event
    div_from_ref = raw.refinement_events * cfg.refinement_diversity_strength_step
    div_delta = min(cfg.max_diversity_strength_delta, div_from_comp + div_from_ref)
    if div_delta > 1e-9:
        lines.append(
            f"비교·정교화 행동으로 다양성 재순위 강도 +{div_delta:.3f}(상한 {cfg.max_diversity_strength_delta:.3f}).",
        )

    spread = max(mult.values()) - min(mult.values()) if mult else 0.0
    window = int(round(sum(raw.signal_mix.values())))

    metrics = PersonalizationMetrics(
        window_events=window,
        weighted_mass=round(raw.weighted_mass, 6),
        temporal_decay=cfg.temporal_decay_per_step,
        trait_gate_factor=round(gate, 6),
        refinement_events=raw.refinement_events,
        gated_trait_nudges=gated_trait,
        trait_nudge_l1=round(_l1(trait_nudges), 6),
        part_multiplier_spread=round(spread, 6),
        signal_mix=tuple(sorted(raw.signal_mix.items(), key=lambda x: x[0])[:24]),
    )

    return LearningAdjustments(
        part_score_multipliers=mult,
        trait_nudges=trait_nudges,
        weight_overlay_switch=w_switch,
        weight_overlay_plate={},
        weight_overlay_foam={},
        weight_overlay_layout={},
        diversity_ranking_strength_delta=div_delta,
        explanation_lines=tuple(lines[:28]),
        personalization=metrics,
    )
