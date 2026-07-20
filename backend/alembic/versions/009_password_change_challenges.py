"""Add password-change email challenge table.

Revision ID: 009_password_change_challenges
Revises: 008_deletion_challenges
Create Date: 2026-07-21
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "009_password_change_challenges"
down_revision: Union[str, None] = "008_deletion_challenges"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "auth_password_change_challenges",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code_hash", sa.Text(), nullable=False),
        sa.Column("verification_token", sa.String(length=128), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_auth_password_change_challenges_user_id"),
    )
    op.create_index(op.f("ix_auth_password_change_challenges_user_id"), "auth_password_change_challenges", ["user_id"])
    op.create_index(
        op.f("ix_auth_password_change_challenges_expires_at"),
        "auth_password_change_challenges",
        ["expires_at"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_auth_password_change_challenges_expires_at"), table_name="auth_password_change_challenges")
    op.drop_index(op.f("ix_auth_password_change_challenges_user_id"), table_name="auth_password_change_challenges")
    op.drop_table("auth_password_change_challenges")
