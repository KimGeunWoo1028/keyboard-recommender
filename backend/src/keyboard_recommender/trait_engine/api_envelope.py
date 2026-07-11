"""HTTP/API payload assembly for `POST /recommendations/compute` (single entry)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from keyboard_recommender.catalog.catalog_seed_images import resolve_part_image_url
from keyboard_recommender.catalog.swagkey_source_url import resolve_catalog_source_url
from keyboard_recommender.config.settings import Settings
from keyboard_recommender.recommendation_quality.feedback_learning.nudge import apply_trait_nudges
from keyboard_recommender.recommendation_quality.feedback_learning.pipeline import load_learning_adjustments
from keyboard_recommender.recommendation_quality.feature_flags.types import OperationalFeatureFlags
from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS
from keyboard_recommender.trait_engine.explainable import build_explainable_pick, confidence_from_weighted_cosine
from keyboard_recommender.trait_engine.legacy_accumulator import trait_from_survey_dict
from keyboard_recommender.trait_engine.legacy_projection import legacy_six_axis_from_multi
from keyboard_recommender.trait_engine.matching import RankedPart
from keyboard_recommender.terminology.dictionary import default_dictionary
from keyboard_recommender.terminology.engine import interpret_community_text, merge_with_survey_traits
from keyboard_recommender.trait_engine.pipeline import TraitEngineResult, recommend_from_user_traits
from keyboard_recommender.trait_engine.survey_profile import survey_answers_to_trait_scores
from keyboard_recommender.trait_engine.weights import (
    weights_for_case,
    weights_for_foam,
    weights_for_keycap,
    weights_for_layout,
    weights_for_plate,
    weights_for_switch,
)


def _compatibility_audit_dict(engine: TraitEngineResult) -> dict[str, Any] | None:
    a = engine.compatibility_audit
    if a is None:
        return None
    return {
        "intentMultiplier": round(float(a.intent_multiplier), 6),
        "rawPenaltyTotal": float(a.raw_penalty_total),
        "effectivePenaltyTotal": float(a.effective_penalty_total),
        "lines": [
            {
                "ruleId": ln.rule_id,
                "rawPenalty": round(float(ln.raw_penalty), 6),
                "effectivePenalty": round(float(ln.effective_penalty), 6),
                "message": ln.message,
                "severity": ln.severity,
                "state": ln.state,
                "category": ln.category,
            }
            for ln in a.lines
        ],
        "hasHardIncompatibility": bool(a.has_hard_incompatibility),
        "hardIncompatibilityCount": int(a.hard_incompatibility_count),
        "softPenaltyCount": int(a.soft_penalty_count),
        "warningCount": int(a.warning_count),
        "summaryLines": list(a.summary_lines),
    }


def _fallback_audit_dict(engine: TraitEngineResult) -> dict[str, Any] | None:
    fb = engine.fallback_audit
    if fb is None:
        return None
    return {
        "recovered": fb.recovered,
        "tier": fb.tier,
        "compatibilityRelaxMult": float(fb.compatibility_relax_mult),
        "diversityStrengthMult": float(fb.diversity_strength_mult),
        "triggers": list(fb.triggers),
        "confidenceBefore": float(fb.confidence_before),
        "confidenceAfter": float(fb.confidence_after),
        "overallLabel": fb.overall_label,
        "notes": list(fb.notes),
    }


def _recommendation_confidence_dict(engine: TraitEngineResult) -> dict[str, Any] | None:
    c = engine.recommendation_confidence
    if c is None:
        return None
    return {
        "overall": float(c.overall),
        "similarityComponent": float(c.similarity_component),
        "compatibilityComponent": float(c.compatibility_component),
        "diversityDistortionComponent": float(c.diversity_distortion_component),
        "fallbackTier": int(c.fallback_tier),
        "label": c.label,
        "hooks": list(c.hooks),
    }


def _diversity_audit_dict(engine: TraitEngineResult) -> dict[str, Any] | None:
    d = engine.diversity_audit
    if d is None:
        return None
    return {
        "families": [
            {
                "family": f.family,
                "originalOrderIds": list(f.original_order_ids),
                "rerankedOrderIds": list(f.reranked_order_ids),
                "notes": list(f.notes),
            }
            for f in d.families
        ],
    }


def _explainable_payload(
    user_trait_scores: dict[str, float],
    ranked: RankedPart,
    weights: dict[str, float],
    *,
    compatibility_lines: tuple[str, ...] = (),
    alternative_part: Any = None,
    include_debug_trace: bool = False,
) -> dict[str, Any]:
    exp = build_explainable_pick(
        user_trait_scores,
        ranked.part,
        weights,
        compatibility_lines=compatibility_lines,
        alternative_part=alternative_part,
        include_debug_trace=include_debug_trace,
    )
    conf = confidence_from_weighted_cosine(ranked.raw_cosine)
    payload = {
        "score": ranked.score,
        "rawCosine": ranked.raw_cosine,
        "confidence": round(conf, 4),
        "summary": exp.summary,
        "whyTraits": list(exp.why_traits),
        "tradeOffs": list(exp.trade_offs),
        # Weighted-axis driver line (same as ranker); UI uses `summary` + bullets for readability.
        "explanation": ranked.explanation,
    }
    if include_debug_trace and exp.debug_trace is not None:
        payload["explanationDebug"] = exp.debug_trace
    return payload


def _pick_source_url(domain: str, part: Any) -> str:
    return resolve_catalog_source_url(domain, str(part.id), item_name=str(part.name))


def _pick_image_url(domain: str, part: Any) -> str:
    return resolve_part_image_url(domain, str(part.id))


def _alternatives_payload(
    user_trait_scores: dict[str, float],
    ranked_list: list[RankedPart],
    weights: dict[str, float],
    *,
    domain: str,
    compatibility_lines: tuple[str, ...] = (),
) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    winner = ranked_list[0].part if ranked_list else None
    for alt in ranked_list[1:3]:
        exp = build_explainable_pick(
            user_trait_scores,
            alt.part,
            weights,
            compatibility_lines=compatibility_lines,
            alternative_part=winner,
        )
        out.append(
            {
                "itemId": alt.part.id,
                "itemName": alt.part.name,
                "score": alt.score,
                "description": alt.part.description or "",
                "summary": exp.summary,
                "tradeOff": exp.trade_offs[0] if exp.trade_offs else "",
                "sourceUrl": _pick_source_url(domain, alt.part),
                "imageUrl": _pick_image_url(domain, alt.part),
            },
        )
    return out


def _confidence_guidance(
    *,
    overall_confidence: float,
    answers: dict[str, str],
) -> dict[str, Any] | None:
    if overall_confidence >= 0.62:
        return None
    prompts: list[str] = []
    if answers.get("bottom_out") == "medium":
        prompts.append("바닥 타건감은 더 부드러운 쪽과 더 단단한 쪽 중 어느 쪽이 더 좋으신가요?")
    else:
        prompts.append("현재 바닥 타건감이 평소 사용 기준으로 너무 부드럽거나 너무 단단하지는 않나요?")
    if answers.get("sound_profile") == "balanced":
        prompts.append("사운드는 묵직한 저음(Thocky) 쪽과 또렷한 고음(Clacky) 쪽 중 어디에 더 가깝길 원하시나요?")
    else:
        prompts.append("현재 결과보다 더 조용한 방향이 좋은지, 더 또렷하고 존재감 있는 방향이 좋은지 선택해 주세요.")
    actions: list[dict[str, str]] = []
    if answers.get("bottom_out") == "medium":
        actions.extend(
            [
                {"label": "부드러운 바닥감 선호", "stepId": "bottom_out", "answerId": "soft"},
                {"label": "단단한 바닥감 선호", "stepId": "bottom_out", "answerId": "firm"},
            ],
        )
    if answers.get("sound_profile") == "balanced":
        actions.extend(
            [
                {"label": "묵직하고 차분한 소리 (Muted) 선호", "stepId": "sound_profile", "answerId": "muted"},
                {"label": "또렷하고 경쾌한 소리 (Clacky) 선호", "stepId": "sound_profile", "answerId": "clacky"},
            ],
        )
    if not actions:
        actions.extend(
            [
                {"label": "더 조용한 세팅 시도", "stepId": "volume", "answerId": "quiet"},
                {"label": "더 생동감 있는 세팅 시도", "stepId": "volume", "answerId": "loud"},
            ],
        )
    return {
        "isLowConfidence": True,
        "shortReason": "비슷하게 잘 맞는 후보가 여러 개라서, 간단한 추가 선택을 하면 정확도를 더 높일 수 있어요.",
        "followUpQuestions": prompts[:2],
        "actions": actions[:2],
    }


# Fraction of the final user vector taken from NL-derived terminology (survey keeps the rest).
_NL_SURVEY_BLEND_WEIGHT = 0.38


def build_recommendation_computation(
    answers: dict[str, str],
    natural_language: str | None = None,
    *,
    db_session: Session | None = None,
    app_settings: Settings | None = None,
    scenario_id: str | None = None,
    runtime_flags: OperationalFeatureFlags | None = None,
    operational_notes: tuple[str, ...] = (),
    include_explanation_debug: bool = False,
) -> tuple[dict[str, Any], TraitEngineResult, dict[str, float], dict[str, str]]:
    """
    Same work as :func:`build_recommendation_result`, but also returns the engine + vectors
    for optional evaluation persistence (without re-running ranking).
    """
    traits = trait_from_survey_dict(answers)
    survey_vec = survey_answers_to_trait_scores(answers)
    nl_analysis: dict[str, Any] = {
        "applied": False,
        "normalizedText": "",
        "parsingConfidence": 0.0,
        "matchedTermIds": [],
        "unknownTokens": [],
        "warnings": [],
    }
    user_trait_scores = dict(survey_vec)
    nl_raw = (natural_language or "").strip()
    nl_norm: str | None = None
    nl_matched_ids: tuple[str, ...] = ()
    if nl_raw:
        intr = interpret_community_text(nl_raw, default_dictionary())
        user_trait_scores = merge_with_survey_traits(
            intr.trait_vector,
            survey_vec,
            nl_weight=_NL_SURVEY_BLEND_WEIGHT,
        )
        nl_norm = intr.normalized_text
        nl_matched_ids = tuple(m.term_id for m in intr.matches)
        nl_analysis = {
            "applied": True,
            "normalizedText": intr.normalized_text,
            "parsingConfidence": intr.parsing_confidence,
            "matchedTermIds": [m.term_id for m in intr.matches],
            "unknownTokens": list(intr.unknown_tokens),
            "warnings": list(intr.warnings),
        }

    learning = None
    feedback_learning_block: dict[str, Any] | None = None
    if app_settings and app_settings.enable_feedback_learning_mvp and db_session is not None:
        learning = load_learning_adjustments(db_session, app_settings, scenario_id=scenario_id)
        pers = learning.personalization
        pers_dict = {
            "windowEvents": pers.window_events,
            "weightedMass": pers.weighted_mass,
            "decayPerStep": pers.temporal_decay,
            "traitGateFactor": pers.trait_gate_factor,
            "refinementEvents": pers.refinement_events,
            "gatedTraitNudges": pers.gated_trait_nudges,
            "traitNudgeL1": pers.trait_nudge_l1,
            "partMultiplierSpread": pers.part_multiplier_spread,
            "signalMix": {k: round(v, 4) for k, v in pers.signal_mix},
        }
        if learning.explanation_lines or learning.part_score_multipliers or learning.trait_nudges:
            feedback_learning_block = {
                "applied": True,
                "scenarioId": scenario_id,
                "lines": list(learning.explanation_lines),
                "sampleMultipliers": {k: round(v, 4) for k, v in list(learning.part_score_multipliers.items())[:12]},
                "personalizationMetrics": pers_dict,
            }
        else:
            feedback_learning_block = {
                "applied": False,
                "reason": "no_recent_interaction_signals",
                "personalizationMetrics": pers_dict,
            }

    engine = recommend_from_user_traits(
        user_trait_scores,
        survey_answers=answers,
        nl_normalized_text=nl_norm,
        nl_matched_term_ids=nl_matched_ids if nl_raw else None,
        learning=learning,
        runtime_flags=runtime_flags,
    )

    ts, tp, tf, tl, tc, tk = (
        engine.top_switch,
        engine.top_plate,
        engine.top_foam,
        engine.top_layout,
        engine.top_case,
        engine.top_keycap,
    )
    debug_explanations_enabled = bool(app_settings.debug and include_explanation_debug) if app_settings is not None else False
    compatibility_messages: tuple[str, ...] = tuple(ln.message for ln in (engine.compatibility_audit.lines if engine.compatibility_audit else ()))

    display_trait_scores = apply_trait_nudges(user_trait_scores, learning.trait_nudges if learning else None)

    user_vector_legacy = legacy_six_axis_from_multi(display_trait_scores)

    title_parts: list[str] = []
    if display_trait_scores["deep_sound"] >= display_trait_scores["high_pitch"] * 0.8:
        title_parts.append("묵직한 저음 중심 (Thocky)")
    else:
        title_parts.append("또렷한 고음 중심 (Clacky)")
    if display_trait_scores["strong_tactile"] > display_trait_scores["smooth"]:
        title_parts.append("구분감 있는 키감 (Tactile)")
    else:
        title_parts.append("매끈한 키감 (Linear)")
    title = f"추천 조합: {' · '.join(title_parts)}"
    tagline = (
        "다축 취향 프로필의 가중 유사도를 기반으로 추천된 조합입니다. "
        "(스위치, 플레이트, 폼, 레이아웃, 케이스/키트, 키캡에 동일한 성향 축을 적용)"
    )

    highlights = [
        f"추천 엔진 v2 — 스위치 {ts.score:.3f} ({ts.part.name})",
        f"플레이트 {tp.score:.3f} · 폼 {tf.score:.3f} · 레이아웃 {tl.score:.3f} · 케이스 {tc.score:.3f} · 키캡 {tk.score:.3f}",
        f"주요 성향 축: deep_sound {display_trait_scores['deep_sound']:.1f}, muted {display_trait_scores['muted']:.1f}, "
        f"soft_bottom_out {display_trait_scores['soft_bottom_out']:.1f}, smooth {display_trait_scores['smooth']:.1f}",
    ]
    if nl_analysis["applied"]:
        pc = float(nl_analysis["parsingConfidence"])
        n_terms = len(nl_analysis["matchedTermIds"])
        highlights.insert(
            0,
            f"자유 입력 반영 ({int(_NL_SURVEY_BLEND_WEIGHT * 100)}% 가중): {n_terms}개 용어 인식, "
            f"해석 신뢰도 {pc * 100:.0f}%.",
        )

    compat = _compatibility_audit_dict(engine)
    if compat and compat.get("lines"):
        highlights.append(
            f"호환성 보정: {len(compat['lines'])}개 규칙 적용; "
            f"유효 페널티 {float(compat['effectivePenaltyTotal']):.3f} "
            f"(의도 가중치 {float(compat['intentMultiplier']):.2f}).",
        )
    if compat and compat.get("summaryLines"):
        highlights.extend([f"호환성 요약: {ln}" for ln in list(compat.get("summaryLines") or [])[:2]])

    div = _diversity_audit_dict(engine)
    if div and any(
        fa["originalOrderIds"] != fa["rerankedOrderIds"] for fa in div.get("families", [])
    ):
        highlights.append(
            "다양성 재정렬: 성향 다양성을 위해 대안 후보 순서를 조정했습니다. (1순위는 유지)",
        )

    fb = _fallback_audit_dict(engine)
    if fb and fb.get("recovered"):
        highlights.append(
            f"안정 복구 모드 (단계 {fb['tier']}): 호환성 선택 가중치를 "
            f"{float(fb['compatibilityRelaxMult']):.2f}로 완화하고, 실제 호환성 안내는 유지했습니다.",
        )

    confd = _recommendation_confidence_dict(engine)
    if confd:
        highlights.append(
            f"추천 신뢰도: {confd['label']} ({float(confd['overall']):.0%})",
        )
    for note in operational_notes:
        highlights.append(f"운영 자동화 메모: {note}")

    build = {
        "id": f"engine-{ts.part.id}-{tp.part.id}-{tc.part.id}-{tk.part.id}",
        "title": title,
        "tagline": tagline,
        "switches": f"{ts.part.name} — {ts.part.description}",
        "plate": f"{tp.part.name} — {tp.part.description}",
        "foam": f"{tf.part.name} — {tf.part.description}",
        "layout": f"{tl.part.name} — {tl.part.description}",
        "case": f"{tc.part.name} — {tc.part.description}",
        "keycap": f"{tk.part.name} — {tk.part.description}",
        "highlights": highlights,
        "engineScores": {
            "switchId": ts.part.id,
            "plateId": tp.part.id,
            "foamId": tf.part.id,
            "layoutId": tl.part.id,
            "caseId": tc.part.id,
            "keycapId": tk.part.id,
            "switchScore": ts.score,
            "plateScore": tp.score,
            "foamScore": tf.score,
            "layoutScore": tl.score,
            "caseScore": tc.score,
            "keycapScore": tk.score,
        },
        "sourceUrls": {
            "switch": _pick_source_url("switch", ts.part),
            "plate": _pick_source_url("plate", tp.part),
            "foam": _pick_source_url("foam", tf.part),
            "layout": _pick_source_url("layout", tl.part),
            "case": _pick_source_url("case", tc.part),
            "keycap": _pick_source_url("keycap", tk.part),
        },
    }

    picks: list[dict[str, Any]] = [
        {
            "domain": "switch",
            "itemId": ts.part.id,
            "itemName": ts.part.name,
            "sourceUrl": _pick_source_url("switch", ts.part),
            "imageUrl": _pick_image_url("switch", ts.part),
            **_explainable_payload(
                display_trait_scores,
                ts,
                weights_for_switch(),
                compatibility_lines=compatibility_messages,
                alternative_part=engine.ranked_switches[1].part if len(engine.ranked_switches) > 1 else None,
                include_debug_trace=debug_explanations_enabled,
            ),
            "alternatives": _alternatives_payload(
                display_trait_scores,
                engine.ranked_switches,
                weights_for_switch(),
                domain="switch",
                compatibility_lines=compatibility_messages,
            ),
        },
        {
            "domain": "plate",
            "itemId": tp.part.id,
            "itemName": tp.part.name,
            "sourceUrl": _pick_source_url("plate", tp.part),
            "imageUrl": _pick_image_url("plate", tp.part),
            **_explainable_payload(
                display_trait_scores,
                tp,
                weights_for_plate(),
                compatibility_lines=compatibility_messages,
                alternative_part=engine.ranked_plates[1].part if len(engine.ranked_plates) > 1 else None,
                include_debug_trace=debug_explanations_enabled,
            ),
            "alternatives": _alternatives_payload(
                display_trait_scores,
                engine.ranked_plates,
                weights_for_plate(),
                domain="plate",
                compatibility_lines=compatibility_messages,
            ),
        },
        {
            "domain": "foam",
            "itemId": tf.part.id,
            "itemName": tf.part.name,
            "sourceUrl": _pick_source_url("foam", tf.part),
            "imageUrl": _pick_image_url("foam", tf.part),
            **_explainable_payload(
                display_trait_scores,
                tf,
                weights_for_foam(),
                compatibility_lines=compatibility_messages,
                alternative_part=engine.ranked_foams[1].part if len(engine.ranked_foams) > 1 else None,
                include_debug_trace=debug_explanations_enabled,
            ),
            "alternatives": _alternatives_payload(
                display_trait_scores,
                engine.ranked_foams,
                weights_for_foam(),
                domain="foam",
                compatibility_lines=compatibility_messages,
            ),
        },
        {
            "domain": "layout",
            "itemId": tl.part.id,
            "itemName": tl.part.name,
            "sourceUrl": _pick_source_url("layout", tl.part),
            "imageUrl": _pick_image_url("layout", tl.part),
            **_explainable_payload(
                display_trait_scores,
                tl,
                weights_for_layout(),
                compatibility_lines=compatibility_messages,
                alternative_part=engine.ranked_layouts[1].part if len(engine.ranked_layouts) > 1 else None,
                include_debug_trace=debug_explanations_enabled,
            ),
            "alternatives": _alternatives_payload(
                display_trait_scores,
                engine.ranked_layouts,
                weights_for_layout(),
                domain="layout",
                compatibility_lines=compatibility_messages,
            ),
        },
        {
            "domain": "case",
            "itemId": tc.part.id,
            "itemName": tc.part.name,
            "sourceUrl": _pick_source_url("case", tc.part),
            "imageUrl": _pick_image_url("case", tc.part),
            **_explainable_payload(
                display_trait_scores,
                tc,
                weights_for_case(),
                compatibility_lines=compatibility_messages,
                alternative_part=engine.ranked_cases[1].part if len(engine.ranked_cases) > 1 else None,
                include_debug_trace=debug_explanations_enabled,
            ),
            "alternatives": _alternatives_payload(
                display_trait_scores,
                engine.ranked_cases,
                weights_for_case(),
                domain="case",
                compatibility_lines=compatibility_messages,
            ),
        },
        {
            "domain": "keycap",
            "itemId": tk.part.id,
            "itemName": tk.part.name,
            "sourceUrl": _pick_source_url("keycap", tk.part),
            "imageUrl": _pick_image_url("keycap", tk.part),
            **_explainable_payload(
                display_trait_scores,
                tk,
                weights_for_keycap(),
                compatibility_lines=compatibility_messages,
                alternative_part=engine.ranked_keycaps[1].part if len(engine.ranked_keycaps) > 1 else None,
                include_debug_trace=debug_explanations_enabled,
            ),
            "alternatives": _alternatives_payload(
                display_trait_scores,
                engine.ranked_keycaps,
                weights_for_keycap(),
                domain="keycap",
                compatibility_lines=compatibility_messages,
            ),
        },
    ]
    confidences = [confidence_from_weighted_cosine(x.raw_cosine) for x in (ts, tp, tf, tl, tc, tk)]
    overall_confidence = round(sum(confidences) / len(confidences), 4) if confidences else 0.0

    payload: dict[str, Any] = {
        "answers": answers,
        "legacyTraits": traits.to_api_dict(),
        "userVector": user_vector_legacy,
        "userTraitScores": display_trait_scores,
        "traitAxes": list(TRAIT_AXIS_IDS),
        "recommendations": picks,
        "matchExplanations": list(picks),
        "overallConfidence": overall_confidence,
        "build": build,
        "completedAtIso": datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "nlPreferenceAnalysis": nl_analysis,
        "compatibilityAudit": compat,
        "diversityAudit": div,
        "fallbackAudit": fb,
        "recommendationConfidence": confd,
        "confidenceGuidance": _confidence_guidance(
            overall_confidence=overall_confidence,
            answers=answers,
        ),
    }
    if feedback_learning_block is not None:
        payload["feedbackLearning"] = feedback_learning_block
    return payload, engine, display_trait_scores, answers


def build_recommendation_result(
    answers: dict[str, str],
    natural_language: str | None = None,
) -> dict[str, Any]:
    payload, _engine, _uts, _ans = build_recommendation_computation(answers, natural_language=natural_language)
    return payload
