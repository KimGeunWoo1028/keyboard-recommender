"""Deterministic explanation pipeline grounded in product metadata and trait evidence."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping

from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS
from keyboard_recommender.trait_engine.models import KeyboardPart
from keyboard_recommender.trait_engine.vectors import weighted_cosine_similarity

TRAIT_LABELS: dict[str, str] = {
    "deep_sound": "묵직한 저음",
    "high_pitch": "또렷한 고음",
    "muted": "차분한 감쇠음",
    "poppy": "통통 튀는 반응감",
    "marbly": "또각거리는 배음",
    "smooth": "매끈한 타건감",
    "scratchy": "서걱이는 마찰감",
    "soft_bottom_out": "푹신한 바닥감",
    "firm_bottom_out": "단단한 바닥감",
    "flexible": "유연한 키감",
    "stiff": "단단한 고정감",
    "strong_tactile": "구분감 있는 키감",
    "light_typing_force": "가벼운 입력 압력",
}


def trait_label(axis_id: str) -> str:
    return TRAIT_LABELS.get(axis_id, axis_id.replace("_", " "))


def confidence_from_weighted_cosine(raw_cosine: float) -> float:
    return max(0.0, min(1.0, (float(raw_cosine) + 1.0) / 2.0))


@dataclass(frozen=True, slots=True)
class ExplainablePick:
    summary: str
    why_traits: tuple[str, ...]
    trade_offs: tuple[str, ...]
    sources: tuple[str, ...] = ()
    debug_trace: dict[str, Any] | None = None


def _axis_contributions(
    user: Mapping[str, float],
    item: Mapping[str, float],
    weights: Mapping[str, float],
) -> list[tuple[str, float]]:
    scored: list[tuple[str, float]] = []
    for axis in TRAIT_AXIS_IDS:
        w = float(weights.get(axis, 1.0))
        c = w * float(user.get(axis, 0.0)) * float(item.get(axis, 0.0))
        if abs(c) > 1e-9:
            scored.append((axis, c))
    scored.sort(key=lambda x: abs(x[1]), reverse=True)
    return scored


def _render_metadata_evidence(part: KeyboardPart) -> tuple[list[str], list[str]]:
    md = part.metadata if isinstance(part.metadata, Mapping) else {}
    lines: list[str] = []
    used_fields: list[str] = []
    if not md:
        return lines, used_fields
    family = str(part.family or "").lower()

    def pick(name: str, default: Any = None) -> Any:
        if name in md:
            used_fields.append(name)
        return md.get(name, default)

    if family == "switch":
        spring = pick("spring_weight_g")
        long_pole = bool(pick("long_pole", False))
        if spring is not None:
            weight = float(spring)
            heaviness = "무거운" if weight >= 50 else ("가벼운" if weight <= 43 else "중간 무게의")
            lines.append(f"{heaviness} 스프링({weight:.0f}g) 설정입니다.")
        if long_pole:
            lines.append("롱폴 구조라 바닥 타건이 비교적 단단하게 형성됩니다.")
        if pick("factory_lubed") is True:
            lines.append("팩토리 윤활이 적용되어 마찰감을 줄인 세팅입니다.")
    elif family == "plate":
        material = str(pick("material") or "").strip()
        flex = pick("flex_rating")
        if material:
            lines.append(f"{material} 소재 플레이트입니다.")
        if flex is not None:
            lines.append(f"플렉스 강도는 {int(float(flex))}/10 수준입니다.")
    elif family == "foam":
        damp = pick("dampening_strength")
        place = str(pick("placement_type") or "").strip()
        if damp is not None:
            lines.append(f"감쇠 강도 {int(float(damp))}/10으로 소리 정돈을 강화하는 방향입니다.")
        if place:
            lines.append(f"{place} 위치 중심 흡음 구성입니다.")
    elif family == "layout":
        size = str(pick("layout_size") or "").strip()
        density = pick("typing_density")
        if size:
            lines.append(f"{size} 배열 기반 레이아웃입니다.")
        if density is not None:
            lines.append(f"키 밀도는 {int(float(density))}/10 수준입니다.")
    return lines[:2], used_fields


def _render_alternative_tradeoff(
    user: Mapping[str, float],
    winner: KeyboardPart,
    alternative: KeyboardPart | None,
) -> str:
    if alternative is None:
        return ""
    best_axis = ""
    best_gap = 0.0
    worst_axis = ""
    worst_gap = 0.0
    for axis in TRAIT_AXIS_IDS:
        u = float(user.get(axis, 0.0))
        wv = float(winner.traits.get(axis, 0.0))
        av = float(alternative.traits.get(axis, 0.0))
        pref_score = u * (av - wv)
        if pref_score > best_gap:
            best_gap = pref_score
            best_axis = axis
        if pref_score < worst_gap:
            worst_gap = pref_score
            worst_axis = axis
    if best_axis and worst_axis:
        return (
            f"대안 {alternative.name}은(는) {trait_label(best_axis)} 측면을 더 보완하지만, "
            f"{trait_label(worst_axis)} 축 정합성이 낮아 전체 순위는 현재 후보가 앞섰습니다."
        )
    return ""


def build_explainable_pick(
    user: Mapping[str, float],
    part: KeyboardPart,
    weights: Mapping[str, float],
    *,
    compatibility_lines: tuple[str, ...] = (),
    alternative_part: KeyboardPart | None = None,
    top_positive_axes: int = 3,
    max_tradeoffs: int = 3,
    include_debug_trace: bool = False,
) -> ExplainablePick:
    item = dict(part.traits)
    raw_cos = weighted_cosine_similarity(user, item, weights)
    contribs = _axis_contributions(user, item, weights)
    positive = [(k, c) for k, c in contribs if c > 0.15][:top_positive_axes]
    negative = [(k, c) for k, c in contribs if c < -0.3][:max_tradeoffs]

    metadata_lines, metadata_fields = _render_metadata_evidence(part)
    sources: list[str] = []
    if metadata_lines:
        sources.append("metadata-derived")
    if positive:
        sources.append("trait-alignment")
    if compatibility_lines:
        sources.append("compatibility-reasoning")
    if alternative_part is not None:
        sources.append("trade-off-reasoning")

    why_lines: list[str] = []
    for axis, contribution in positive:
        u = float(user.get(axis, 0.0))
        v = float(item.get(axis, 0.0))
        why_lines.append(
            f"{trait_label(axis)} 선호({u:+.1f})와 후보 특성({v:+.1f})이 같은 방향이라 "
            f"정합 기여가 큽니다({contribution:+.1f})."
        )

    trade_lines: list[str] = []
    for axis, contribution in negative:
        u = float(user.get(axis, 0.0))
        v = float(item.get(axis, 0.0))
        trade_lines.append(
            f"{trait_label(axis)} 축은 타협이 있습니다. 선호({u:+.1f}) 대비 후보 특성({v:+.1f})이 어긋나 "
            f"기여가 낮아집니다({contribution:+.1f})."
        )
    for line in compatibility_lines[:1]:
        trade_lines.append(f"호환성 관점: {line}")
    alt_line = _render_alternative_tradeoff(user, part, alternative_part)
    if alt_line:
        trade_lines.append(alt_line)
    if raw_cos < 0.12 and not trade_lines:
        trade_lines.append("완전 일치 후보가 부족해 현재 카탈로그에서 가장 근접한 균형안을 추천했습니다.")

    labels = [trait_label(axis) for axis, _c in positive[:2]]
    if labels:
        trait_joined = " · ".join(labels)
        if metadata_lines:
            summary = (
                f"{part.name}은(는) {metadata_lines[0]} "
                f"그리고 {trait_joined} 성향 정합이 높아 상위 추천되었습니다."
            )
        else:
            summary = f"{part.name}은(는) {trait_joined} 축 정합이 높아 상위 추천되었습니다."
    elif metadata_lines:
        summary = f"{part.name}은(는) {metadata_lines[0]} 특성 기반으로 현재 조건에서 가장 안정적인 선택입니다."
    else:
        summary = f"{part.name}은(는) 단일 축보다 전체 균형 점수가 높아 추천되었습니다."

    trace: dict[str, Any] | None = None
    if include_debug_trace:
        trace = {
            "sources": sources,
            "metadataFields": metadata_fields,
            "strongestTraits": [
                {
                    "axis": axis,
                    "user": round(float(user.get(axis, 0.0)), 4),
                    "item": round(float(item.get(axis, 0.0)), 4),
                    "contribution": round(float(contribution), 4),
                }
                for axis, contribution in positive
            ],
            "conflictingTraits": [
                {
                    "axis": axis,
                    "user": round(float(user.get(axis, 0.0)), 4),
                    "item": round(float(item.get(axis, 0.0)), 4),
                    "contribution": round(float(contribution), 4),
                }
                for axis, contribution in negative
            ],
            "compatibilityPenalties": list(compatibility_lines),
        }
        if alternative_part is not None:
            trace["alternativeCandidate"] = {"itemId": alternative_part.id, "itemName": alternative_part.name}

    return ExplainablePick(
        summary=summary,
        why_traits=tuple(metadata_lines + why_lines),
        trade_offs=tuple(trade_lines[: max_tradeoffs + 2]),
        sources=tuple(sources),
        debug_trace=trace,
    )
