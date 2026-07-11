"""Canonical recommendation trait axes (matches engine keys; extend via migrations)."""

from __future__ import annotations

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from keyboard_recommender.infrastructure.persistence.base import Base


class RecommendationTrait(Base):
    """
    One row per trait dimension (e.g. deep_sound, clacky).
    Component scores reference this table for FK integrity and labeling.
    """

    __tablename__ = "recommendation_traits"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    switch_scores: Mapped[list["SwitchTraitScore"]] = relationship(
        "SwitchTraitScore",
        back_populates="trait",
        passive_deletes=True,
    )
    plate_scores: Mapped[list["PlateTraitScore"]] = relationship(
        "PlateTraitScore",
        back_populates="trait",
        passive_deletes=True,
    )
    foam_config_scores: Mapped[list["FoamConfigTraitScore"]] = relationship(
        "FoamConfigTraitScore",
        back_populates="trait",
        passive_deletes=True,
    )
    keyboard_layout_scores: Mapped[list["KeyboardLayoutTraitScore"]] = relationship(
        "KeyboardLayoutTraitScore",
        back_populates="trait",
        passive_deletes=True,
    )
    keyboard_case_scores: Mapped[list["KeyboardCaseTraitScore"]] = relationship(
        "KeyboardCaseTraitScore",
        back_populates="trait",
        passive_deletes=True,
    )
