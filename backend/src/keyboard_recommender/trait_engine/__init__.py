"""
Multi-dimensional keyboard trait engine + API envelope.

- **Scoring**: `trait_engine.matching` + `trait_engine.vectors.weighted_cosine_similarity`
- **Survey → API JSON**: `trait_engine.api_envelope.build_recommendation_result`
"""

from keyboard_recommender.trait_engine.api_envelope import build_recommendation_result
from keyboard_recommender.trait_engine.pipeline import recommend_from_survey, recommend_from_user_traits

__all__ = (
    "build_recommendation_result",
    "recommend_from_survey",
    "recommend_from_user_traits",
)
