"""
Recommendation quality layer (compatibility, diversity, fallback — phased).

Includes **compatibility penalties**, **diversity list reranking**, and **incremental fallback recovery**
with **build confidence** metadata for the API.
"""

from __future__ import annotations

from keyboard_recommender.recommendation_quality.build_selection import pick_build_with_compatibility
from keyboard_recommender.recommendation_quality.config import QualityConfig, default_quality_config
from keyboard_recommender.recommendation_quality.diversity.config import DiversityConfig
from keyboard_recommender.recommendation_quality.diversity.rerank import rerank_family_lists

__all__ = [
    "DiversityConfig",
    "QualityConfig",
    "default_quality_config",
    "evaluate_recommendation",
    "pick_build_with_compatibility",
    "rerank_family_lists",
]


def __getattr__(name: str):
    # Lazy: evaluation pulls `trait_engine.pipeline`; eager import here would cycle
    # when `pipeline` loads `recommendation_quality` during package init.
    if name == "evaluate_recommendation":
        from keyboard_recommender.recommendation_quality.evaluation import evaluate_recommendation

        return evaluate_recommendation
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
