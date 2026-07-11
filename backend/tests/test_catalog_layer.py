"""Catalog tier normalization + projection smoke tests."""

from __future__ import annotations


from keyboard_recommender.catalog.normalize import sparse_tiers_to_scores, tier_to_score
from keyboard_recommender.catalog.projection import project_catalog_to_engine_vector
from keyboard_recommender.catalog.validation import validate_family_traits
from keyboard_recommender.trait_engine.axes import TRAIT_AXIS_IDS


def test_tier_to_score_mapping() -> None:
    assert tier_to_score("low") == 0.0
    assert tier_to_score("medium") == 0.5
    assert tier_to_score("high") == 1.0


def test_sparse_tiers_to_scores() -> None:
    s = sparse_tiers_to_scores({"deep_sound": "high", "smooth": "low"})
    assert s["deep_sound"] == 1.0 and s["smooth"] == 0.0


def test_validate_family_traits_switch() -> None:
    traits = {"deep_sound": "high", "smooth": "medium", "stiffness": "low"}
    issues = validate_family_traits("switch", traits)
    assert any("stiffness" in m for m in issues)


def test_validate_family_traits_plate_ok() -> None:
    traits = {"stiffness": "high", "high_pitch": "medium"}
    assert validate_family_traits("plate", traits) == []


def test_project_catalog_to_engine_dense() -> None:
    vec = project_catalog_to_engine_vector(sparse_tiers_to_scores({"deep_sound": "high", "loudness": "low"}))
    assert set(vec.keys()) == set(TRAIT_AXIS_IDS)
    assert all(isinstance(v, float) for v in vec.values())
