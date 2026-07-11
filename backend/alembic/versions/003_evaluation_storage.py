"""Evaluation storage: snapshots, metrics, diagnostics, confidence, benchmarks, events.

Revision ID: 003_evaluation_storage
Revises: 002_keyboard_cases
Create Date: 2026-05-03

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003_evaluation_storage"
down_revision: Union[str, None] = "002_keyboard_cases"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "eval_recommendation_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("scenario_id", sa.String(length=256), nullable=True),
        sa.Column("request_id", sa.String(length=128), nullable=True),
        sa.Column("source", sa.String(length=64), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("config_fingerprint", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_eval_runs_scenario_created", "eval_recommendation_runs", ["scenario_id", "created_at"])
    op.create_index(op.f("ix_eval_recommendation_runs_request_id"), "eval_recommendation_runs", ["request_id"])
    op.create_index(op.f("ix_eval_recommendation_runs_scenario_id"), "eval_recommendation_runs", ["scenario_id"])

    op.create_table(
        "eval_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("schema_version", sa.String(length=64), nullable=False),
        sa.Column("body", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["run_id"], ["eval_recommendation_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("run_id"),
    )

    op.create_table(
        "eval_metrics",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("trait_alignment", sa.Numeric(precision=14, scale=8), nullable=False),
        sa.Column("diversity_intervention", sa.Numeric(precision=14, scale=8), nullable=False),
        sa.Column("build_coherence", sa.Numeric(precision=14, scale=8), nullable=False),
        sa.Column("compatibility_stability", sa.Numeric(precision=14, scale=8), nullable=False),
        sa.Column("reranking_distortion_index", sa.Numeric(precision=14, scale=8), nullable=False),
        sa.Column("winner_trait_diversity", sa.Numeric(precision=14, scale=8), nullable=False),
        sa.Column("body", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["run_id"], ["eval_recommendation_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("run_id"),
    )
    op.create_index("ix_eval_metrics_run", "eval_metrics", ["run_id"])

    op.create_table(
        "eval_diagnostics",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("body", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["run_id"], ["eval_recommendation_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("run_id"),
    )

    op.create_table(
        "eval_confidence_samples",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("overall", sa.Numeric(precision=14, scale=8), nullable=True),
        sa.Column("label", sa.String(length=64), nullable=True),
        sa.Column("components", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["run_id"], ["eval_recommendation_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("run_id"),
    )
    op.create_index("ix_eval_confidence_run", "eval_confidence_samples", ["run_id"])
    op.create_index("ix_eval_confidence_recorded", "eval_confidence_samples", ["recorded_at"])

    op.create_table(
        "eval_benchmark_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("scenario_id", sa.String(length=256), nullable=True),
        sa.Column("baseline_run_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("treatment_run_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("baseline_label", sa.String(length=128), nullable=True),
        sa.Column("treatment_label", sa.String(length=128), nullable=True),
        sa.Column("report", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["baseline_run_id"], ["eval_recommendation_runs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["treatment_run_id"], ["eval_recommendation_runs.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_eval_benchmark_scenario_created", "eval_benchmark_runs", ["scenario_id", "created_at"])

    op.create_table(
        "eval_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("benchmark_run_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("correlation_id", sa.String(length=128), nullable=True),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["benchmark_run_id"], ["eval_benchmark_runs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["run_id"], ["eval_recommendation_runs.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_eval_events_type_created", "eval_events", ["event_type", "created_at"])
    op.create_index("ix_eval_events_run", "eval_events", ["run_id"])


def downgrade() -> None:
    op.drop_index("ix_eval_events_run", table_name="eval_events")
    op.drop_index("ix_eval_events_type_created", table_name="eval_events")
    op.drop_table("eval_events")

    op.drop_index("ix_eval_benchmark_scenario_created", table_name="eval_benchmark_runs")
    op.drop_table("eval_benchmark_runs")

    op.drop_index("ix_eval_confidence_recorded", table_name="eval_confidence_samples")
    op.drop_index("ix_eval_confidence_run", table_name="eval_confidence_samples")
    op.drop_table("eval_confidence_samples")

    op.drop_table("eval_diagnostics")

    op.drop_index("ix_eval_metrics_run", table_name="eval_metrics")
    op.drop_table("eval_metrics")

    op.drop_table("eval_snapshots")

    op.drop_index(op.f("ix_eval_recommendation_runs_scenario_id"), table_name="eval_recommendation_runs")
    op.drop_index(op.f("ix_eval_recommendation_runs_request_id"), table_name="eval_recommendation_runs")
    op.drop_index("ix_eval_runs_scenario_created", table_name="eval_recommendation_runs")
    op.drop_table("eval_recommendation_runs")
