"""Switch catalog + per-trait scores."""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import ForeignKey, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from keyboard_recommender.infrastructure.persistence.base import Base
from keyboard_recommender.infrastructure.persistence.models.mixins import TimestampMixin


class Switch(Base, TimestampMixin):
    __tablename__ = "switches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list[str]] = mapped_column(
        ARRAY(String(64)),
        nullable=False,
        server_default=text("ARRAY[]::varchar[]"),
    )
    sound_profile_metadata: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )
    popularity_weight: Mapped[Decimal] = mapped_column(
        Numeric(8, 4),
        nullable=False,
        server_default=text("1.0"),
    )

    trait_scores: Mapped[list["SwitchTraitScore"]] = relationship(
        "SwitchTraitScore",
        back_populates="switch",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class SwitchTraitScore(Base):
    __tablename__ = "switch_trait_scores"

    switch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("switches.id", ondelete="CASCADE"),
        primary_key=True,
    )
    trait_id: Mapped[int] = mapped_column(
        ForeignKey("recommendation_traits.id", ondelete="CASCADE"),
        primary_key=True,
    )
    score: Mapped[Decimal] = mapped_column(Numeric(8, 4), nullable=False)

    switch: Mapped[Switch] = relationship(back_populates="trait_scores")
    trait: Mapped["RecommendationTrait"] = relationship(
        "RecommendationTrait",
        back_populates="switch_scores",
    )
