from __future__ import annotations

from keyboard_recommender.trait_engine.api_envelope import build_recommendation_result
from tests.recommendation_regression.harness import (
    PROFILE_EXPECTATIONS,
    REGRESSION_CASES,
    canonical_json,
    canonicalize_payload,
    deterministic_seed,
)


def _winner_id(payload: dict) -> str:
    return str(payload["build"]["engineScores"]["switchId"])


def _top_pick_ids(payload: dict) -> list[str]:
    return [str(row["itemId"]) for row in payload.get("recommendations") or []]


def test_regression_cases_are_deterministic_across_runs() -> None:
    for case in REGRESSION_CASES:
        with deterministic_seed():
            a = canonicalize_payload(build_recommendation_result(dict(case.answers)))
            b = canonicalize_payload(build_recommendation_result(dict(case.answers)))
        assert canonical_json(a) == canonical_json(b), (
            f"[ranking regression] nondeterministic output for profile={case.name!r}: "
            "run changed canonical payload between two seeded executions."
        )


def test_profile_golden_ranking_confidence_and_compatibility() -> None:
    for name, exp in PROFILE_EXPECTATIONS.items():
        case = next((c for c in REGRESSION_CASES if c.name == name), None)
        assert case is not None, f"missing REGRESSION_CASES entry for {name!r}"

        with deterministic_seed():
            payload = build_recommendation_result(dict(case.answers))

        winner = _winner_id(payload)
        assert winner == exp.expected_winner_switch_id, (
            f"[ranking regression] profile={name!r}: expected winner switch {exp.expected_winner_switch_id!r}, got {winner!r}. "
            "If the catalog or engine intentionally changed, update PROFILE_EXPECTATIONS in harness.py."
        )

        tops = _top_pick_ids(payload)
        assert len(tops) >= 4, f"[ranking regression] profile={name!r}: expected at least 4 ranked picks, got {len(tops)}."
        for pid in tops[:4]:
            assert pid in exp.allowed_top5_switch_ids, (
                f"[ranking regression] profile={name!r}: unexpected top pick {pid!r} "
                f"(allowed set: {sorted(exp.allowed_top5_switch_ids)})."
            )

        oc = float(payload["overallConfidence"])
        lo, hi = exp.overall_confidence
        assert lo <= oc <= hi, (
            f"[explanation regression] profile={name!r}: overallConfidence {oc} outside [{lo}, {hi}]. "
            "Adjust bounds in ProfileExpectation if confidence model changed deliberately."
        )

        rc = payload.get("recommendationConfidence") or {}
        rco = float(rc.get("overall", 0.0))
        rlo, rhi = exp.recommendation_confidence_overall
        assert rlo <= rco <= rhi, (
            f"[explanation regression] profile={name!r}: recommendationConfidence.overall {rco} outside [{rlo}, {rhi}]."
        )

        compat = payload.get("compatibilityAudit") or {}
        penalty = float(compat.get("effectivePenaltyTotal", 0.0))
        assert penalty <= exp.max_effective_penalty_total, (
            f"[compatibility regression] profile={name!r}: effectivePenaltyTotal {penalty} "
            f"exceeds max {exp.max_effective_penalty_total}."
        )

        diversity = payload.get("diversityAudit") or {}
        families = diversity.get("families") or []
        assert len(families) >= exp.min_diversity_families, (
            f"[ranking regression] profile={name!r}: expected >= {exp.min_diversity_families} diversity families, "
            f"got {len(families)}."
        )
