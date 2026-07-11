"""Add keyboard_cases + keyboard_case_trait_scores.

Revision ID: 002_keyboard_cases
Revises: 001_initial
Create Date: 2026-05-03

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002_keyboard_cases"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "keyboard_cases",
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
        "keyboard_case_trait_scores",
        sa.Column("keyboard_case_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("trait_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Numeric(precision=8, scale=4), nullable=False),
        sa.ForeignKeyConstraint(["keyboard_case_id"], ["keyboard_cases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["trait_id"], ["recommendation_traits.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("keyboard_case_id", "trait_id"),
    )


def downgrade() -> None:
    op.drop_table("keyboard_case_trait_scores")
    op.drop_table("keyboard_cases")
