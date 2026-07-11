from __future__ import annotations

from keyboard_recommender.catalog.swagkey_recommendation_promotion import evaluate_promotion


def test_evaluate_promotion_rejects_name_inferred_stub() -> None:
    row = {
        "id": "case-050",
        "name": "Test Kit",
        "traitConfidence": "name_inferred",
        "recommendationEligible": False,
        "metadata": {"layout_size": "65"},
    }
    ok, reason = evaluate_promotion(row, family="case")
    assert ok is False
    assert "trait_confidence" in reason


def test_evaluate_promotion_accepts_spec_scraped_case() -> None:
    row = {
        "id": "case-050",
        "name": "Test Kit",
        "traitConfidence": "spec_scraped",
        "recommendationEligible": False,
        "metadata": {"layout_size": "alice"},
    }
    ok, reason = evaluate_promotion(row, family="case")
    assert ok is True
    assert reason == "ready"
