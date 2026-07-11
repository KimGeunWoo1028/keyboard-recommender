"""Initial catalog schema: traits, components, junction scores.

Revision ID: 001_initial
Revises:
Create Date: 2026-05-03

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "recommendation_traits",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("key", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )

    op.create_table(
        "switches",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "tags",
            postgresql.ARRAY(sa.String(length=64)),
            server_default=sa.text("ARRAY[]::varchar[]"),
            nullable=False,
        ),
        sa.Column(
            "sound_profile_metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "popularity_weight",
            sa.Numeric(precision=8, scale=4),
            server_default=sa.text("1.0"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "plates",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "tags",
            postgresql.ARRAY(sa.String(length=64)),
            server_default=sa.text("ARRAY[]::varchar[]"),
            nullable=False,
        ),
        sa.Column(
            "sound_profile_metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "popularity_weight",
            sa.Numeric(precision=8, scale=4),
            server_default=sa.text("1.0"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "foam_configs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "tags",
            postgresql.ARRAY(sa.String(length=64)),
            server_default=sa.text("ARRAY[]::varchar[]"),
            nullable=False,
        ),
        sa.Column(
            "sound_profile_metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "popularity_weight",
            sa.Numeric(precision=8, scale=4),
            server_default=sa.text("1.0"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "keyboard_layouts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "tags",
            postgresql.ARRAY(sa.String(length=64)),
            server_default=sa.text("ARRAY[]::varchar[]"),
            nullable=False,
        ),
        sa.Column(
            "sound_profile_metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "popularity_weight",
            sa.Numeric(precision=8, scale=4),
            server_default=sa.text("1.0"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "switch_trait_scores",
        sa.Column("switch_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("trait_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Numeric(precision=8, scale=4), nullable=False),
        sa.ForeignKeyConstraint(["switch_id"], ["switches.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["trait_id"], ["recommendation_traits.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("switch_id", "trait_id"),
    )

    op.create_table(
        "plate_trait_scores",
        sa.Column("plate_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("trait_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Numeric(precision=8, scale=4), nullable=False),
        sa.ForeignKeyConstraint(["plate_id"], ["plates.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["trait_id"], ["recommendation_traits.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("plate_id", "trait_id"),
    )

    op.create_table(
        "foam_config_trait_scores",
        sa.Column("foam_config_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("trait_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Numeric(precision=8, scale=4), nullable=False),
        sa.ForeignKeyConstraint(["foam_config_id"], ["foam_configs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["trait_id"], ["recommendation_traits.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("foam_config_id", "trait_id"),
    )

    op.create_table(
        "keyboard_layout_trait_scores",
        sa.Column("keyboard_layout_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("trait_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Numeric(precision=8, scale=4), nullable=False),
        sa.ForeignKeyConstraint(["keyboard_layout_id"], ["keyboard_layouts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["trait_id"], ["recommendation_traits.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("keyboard_layout_id", "trait_id"),
    )


def downgrade() -> None:
    op.drop_table("keyboard_layout_trait_scores")
    op.drop_table("foam_config_trait_scores")
    op.drop_table("plate_trait_scores")
    op.drop_table("switch_trait_scores")
    op.drop_table("keyboard_layouts")
    op.drop_table("foam_configs")
    op.drop_table("plates")
    op.drop_table("switches")
    op.drop_table("recommendation_traits")
