"""Add account-deletion email challenge table.

Revision ID: 008_deletion_challenges
Revises: 007_user_avatar_url
Create Date: 2026-07-14
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "008_deletion_challenges"
down_revision: Union[str, None] = "007_user_avatar_url"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "auth_account_deletion_challenges",
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
        sa.UniqueConstraint("user_id", name="uq_auth_account_deletion_challenges_user_id"),
    )
    op.create_index(op.f("ix_auth_account_deletion_challenges_user_id"), "auth_account_deletion_challenges", ["user_id"])
    op.create_index(
        op.f("ix_auth_account_deletion_challenges_expires_at"),
        "auth_account_deletion_challenges",
        ["expires_at"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_auth_account_deletion_challenges_expires_at"), table_name="auth_account_deletion_challenges")
    op.drop_index(op.f("ix_auth_account_deletion_challenges_user_id"), table_name="auth_account_deletion_challenges")
    op.drop_table("auth_account_deletion_challenges")
