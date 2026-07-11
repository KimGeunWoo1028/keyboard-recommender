"""
SQLAlchemy ORM models for evaluation persistence (PostgreSQL-first).

JSON columns use generic :class:`sqlalchemy.JSON` so targeted ``create_all`` works on
SQLite in tests; Alembic migrations use ``JSONB`` for PostgreSQL analytics workloads.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Text, Uuid
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from keyboard_recommender.infrastructure.persistence.base import Base
from keyboard_recommender.infrastructure.persistence.mixins import TimestampMixin


class EvalRecommendationRun(Base, TimestampMixin):
    """
    Anchor for one recommendation evaluation lifecycle (snapshot + metrics + diagnostics).

    ``scenario_id`` groups runs for trend / drift queries without implying a user table.
    """

    __tablename__ = "eval_recommendation_runs"
    __table_args__ = (Index("ix_eval_runs_scenario_created", "scenario_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scenario_id: Mapped[str | None] = mapped_column(String(256), nullable=True, index=True)
    request_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    source: Mapped[str | None] = mapped_column(String(64), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    config_fingerprint: Mapped[str | None] = mapped_column(String(128), nullable=True)

    snapshot: Mapped["EvalSnapshot | None"] = relationship(
        "EvalSnapshot",
        back_populates="run",
        uselist=False,
        cascade="all, delete-orphan",
    )
    metrics: Mapped["EvalMetrics | None"] = relationship(
        "EvalMetrics",
        back_populates="run",
        uselist=False,
        cascade="all, delete-orphan",
    )
    diagnostics: Mapped["EvalDiagnostics | None"] = relationship(
        "EvalDiagnostics",
        back_populates="run",
        uselist=False,
        cascade="all, delete-orphan",
    )
    confidence: Mapped["EvalConfidenceSample | None"] = relationship(
        "EvalConfidenceSample",
        back_populates="run",
        uselist=False,
        cascade="all, delete-orphan",
    )


class EvalSnapshot(Base):
    __tablename__ = "eval_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("eval_recommendation_runs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    schema_version: Mapped[str] = mapped_column(String(64), nullable=False, default="evaluation.snapshot.v1")
    body: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

    run: Mapped[EvalRecommendationRun] = relationship("EvalRecommendationRun", back_populates="snapshot")


class EvalMetrics(Base):
    """Normalized metric columns for efficient analytics + full JSON for forward compatibility."""

    __tablename__ = "eval_metrics"
    __table_args__ = (Index("ix_eval_metrics_run", "run_id"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("eval_recommendation_runs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    trait_alignment: Mapped[Decimal] = mapped_column(Numeric(14, 8), nullable=False)
    diversity_intervention: Mapped[Decimal] = mapped_column(Numeric(14, 8), nullable=False)
    build_coherence: Mapped[Decimal] = mapped_column(Numeric(14, 8), nullable=False)
    compatibility_stability: Mapped[Decimal] = mapped_column(Numeric(14, 8), nullable=False)
    reranking_distortion_index: Mapped[Decimal] = mapped_column(Numeric(14, 8), nullable=False)
    winner_trait_diversity: Mapped[Decimal] = mapped_column(Numeric(14, 8), nullable=False)
    body: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

    run: Mapped[EvalRecommendationRun] = relationship("EvalRecommendationRun", back_populates="metrics")


class EvalDiagnostics(Base):
    __tablename__ = "eval_diagnostics"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("eval_recommendation_runs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    body: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

    run: Mapped[EvalRecommendationRun] = relationship("EvalRecommendationRun", back_populates="diagnostics")


class EvalConfidenceSample(Base):
    """Denormalized confidence row per run for time-series style queries over ``scenario_id``."""

    __tablename__ = "eval_confidence_samples"
    __table_args__ = (
        Index("ix_eval_confidence_run", "run_id"),
        Index("ix_eval_confidence_recorded", "recorded_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("eval_recommendation_runs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    overall: Mapped[Decimal | None] = mapped_column(Numeric(14, 8), nullable=True)
    label: Mapped[str | None] = mapped_column(String(64), nullable=True)
    components: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

    run: Mapped[EvalRecommendationRun] = relationship("EvalRecommendationRun", back_populates="confidence")


class EvalBenchmarkRun(Base, TimestampMixin):
    """Persisted paired comparison (references two runs + optional embedded report)."""

    __tablename__ = "eval_benchmark_runs"
    __table_args__ = (Index("ix_eval_benchmark_scenario_created", "scenario_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scenario_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    baseline_run_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("eval_recommendation_runs.id", ondelete="SET NULL"),
        nullable=True,
    )
    treatment_run_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("eval_recommendation_runs.id", ondelete="SET NULL"),
        nullable=True,
    )
    baseline_label: Mapped[str | None] = mapped_column(String(128), nullable=True)
    treatment_label: Mapped[str | None] = mapped_column(String(128), nullable=True)
    report: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)


class EvalEvent(Base):
    """Append-only operational log (ingestion, benchmarks, manual replays)."""

    __tablename__ = "eval_events"
    __table_args__ = (
        Index("ix_eval_events_type_created", "event_type", "created_at"),
        Index("ix_eval_events_run", "run_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    run_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("eval_recommendation_runs.id", ondelete="SET NULL"),
        nullable=True,
    )
    benchmark_run_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("eval_benchmark_runs.id", ondelete="SET NULL"),
        nullable=True,
    )
    correlation_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
