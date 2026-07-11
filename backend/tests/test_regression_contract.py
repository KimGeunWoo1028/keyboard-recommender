"""Structural + deterministic checks for the public recommendation payload (no binary snapshots)."""

from __future__ import annotations

import pytest

from keyboard_recommender.trait_engine.api_envelope import build_recommendation_computation, build_recommendation_result
from tests.support.regression import (
    STABLE_SURVEY,
    assert_recommendation_api_shape,
    assert_recommendations_match_explanations,
    canonical_json_dumps,
    strip_volatile_recommendation_fields,
)


def test_build_recommendation_result_is_deterministic_for_stable_survey() -> None:
    a = build_recommendation_result(dict(STABLE_SURVEY))
    b = build_recommendation_result(dict(STABLE_SURVEY))
    sa = strip_volatile_recommendation_fields(a)
    sb = strip_volatile_recommendation_fields(b)
    assert canonical_json_dumps(sa) == canonical_json_dumps(sb)


def test_build_recommendation_computation_twice_matches_payload() -> None:
    p1, e1, u1, a1 = build_recommendation_computation(dict(STABLE_SURVEY))
    p2, e2, u2, a2 = build_recommendation_computation(dict(STABLE_SURVEY))
    s1 = strip_volatile_recommendation_fields(p1)
    s2 = strip_volatile_recommendation_fields(p2)
    assert canonical_json_dumps(s1) == canonical_json_dumps(s2)
    assert canonical_json_dumps(u1) == canonical_json_dumps(u2)
    assert a1 == a2
    assert e1.top_switch.part.id == e2.top_switch.part.id


def test_stable_survey_payload_contract_keys() -> None:
    payload = build_recommendation_result(dict(STABLE_SURVEY))
    assert_recommendation_api_shape(payload)
    assert_recommendations_match_explanations(payload)
    assert isinstance(payload["recommendations"], list)
    assert len(payload["recommendations"]) == 6


@pytest.mark.parametrize("family", ("switch", "plate", "foam", "layout", "case", "keycap"))
def test_each_domain_pick_present(family: str) -> None:
    payload = build_recommendation_result(dict(STABLE_SURVEY))
    domains = {p["domain"] for p in payload["recommendations"]}
    assert family in domains
