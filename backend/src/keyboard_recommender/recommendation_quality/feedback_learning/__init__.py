"""MVP feedback loop (explainable, reversible, config-driven)."""

from keyboard_recommender.recommendation_quality.feedback_learning.config import FeedbackLearningMvpConfig
from keyboard_recommender.recommendation_quality.feedback_learning.nudge import apply_trait_nudges
from keyboard_recommender.recommendation_quality.feedback_learning.types import LearningAdjustments, PersonalizationMetrics

__all__ = ["FeedbackLearningMvpConfig", "LearningAdjustments", "PersonalizationMetrics", "apply_trait_nudges"]
