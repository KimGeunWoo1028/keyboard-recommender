"""
ORM models for PostgreSQL.

Import this module (side effects register tables on Base.metadata) before running
Alembic or creating engines.

Tables
------
* recommendation_traits — trait axis definitions
* switches, plates, foam_configs, keyboard_layouts, keyboard_cases — component catalogs
* *_trait_scores — many-to-many scores linking each component to recommendation_traits
"""

from keyboard_recommender.infrastructure.persistence.base import Base
from keyboard_recommender.infrastructure.persistence.models.foam_config import FoamConfig, FoamConfigTraitScore
from keyboard_recommender.infrastructure.persistence.models.keyboard_case import KeyboardCase, KeyboardCaseTraitScore
from keyboard_recommender.infrastructure.persistence.models.keyboard_layout import (
    KeyboardLayout,
    KeyboardLayoutTraitScore,
)
from keyboard_recommender.infrastructure.persistence.models.plate import Plate, PlateTraitScore
from keyboard_recommender.infrastructure.persistence.models.recommendation_trait import RecommendationTrait
from keyboard_recommender.infrastructure.persistence.models.switch import Switch, SwitchTraitScore
from keyboard_recommender.infrastructure.persistence.models.user_auth import (
    AuthEmailVerification,
    AuthPasswordReset,
    AuthSession,
    User,
)

__all__ = [
    "Base",
    "RecommendationTrait",
    "Switch",
    "SwitchTraitScore",
    "Plate",
    "PlateTraitScore",
    "FoamConfig",
    "FoamConfigTraitScore",
    "KeyboardLayout",
    "KeyboardLayoutTraitScore",
    "KeyboardCase",
    "KeyboardCaseTraitScore",
    "User",
    "AuthSession",
    "AuthEmailVerification",
    "AuthPasswordReset",
]
