"""Foam configuration catalog + per-trait scores."""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import ForeignKey, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from keyboard_recommender.infrastructure.persistence.base import Base
from keyboard_recommender.infrastructure.persistence.models.mixins import TimestampMixin


class FoamConfig(Base, TimestampMixin):
    __tablename__ = "foam_configs"

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

    trait_scores: Mapped[list["FoamConfigTraitScore"]] = relationship(
        "FoamConfigTraitScore",
        back_populates="foam_config",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class FoamConfigTraitScore(Base):
    __tablename__ = "foam_config_trait_scores"

    foam_config_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("foam_configs.id", ondelete="CASCADE"),
        primary_key=True,
    )
    trait_id: Mapped[int] = mapped_column(
        ForeignKey("recommendation_traits.id", ondelete="CASCADE"),
        primary_key=True,
    )
    score: Mapped[Decimal] = mapped_column(Numeric(8, 4), nullable=False)

    foam_config: Mapped[FoamConfig] = relationship(back_populates="trait_scores")
    trait: Mapped["RecommendationTrait"] = relationship(
        "RecommendationTrait",
        back_populates="foam_config_scores",
    )
