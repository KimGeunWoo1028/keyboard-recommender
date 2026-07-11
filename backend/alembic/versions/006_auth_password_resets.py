"""Add password reset token table.

Revision ID: 006_auth_password_resets
Revises: 005_auth_email_verifications
Create Date: 2026-05-07
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "006_auth_password_resets"
down_revision: Union[str, None] = "005_auth_email_verifications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "auth_password_resets",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_digest", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_digest", name="uq_auth_password_resets_token_digest"),
    )
    op.create_index(op.f("ix_auth_password_resets_user_id"), "auth_password_resets", ["user_id"])
    op.create_index(op.f("ix_auth_password_resets_token_digest"), "auth_password_resets", ["token_digest"])
    op.create_index(op.f("ix_auth_password_resets_expires_at"), "auth_password_resets", ["expires_at"])


def downgrade() -> None:
    op.drop_index(op.f("ix_auth_password_resets_expires_at"), table_name="auth_password_resets")
    op.drop_index(op.f("ix_auth_password_resets_token_digest"), table_name="auth_password_resets")
    op.drop_index(op.f("ix_auth_password_resets_user_id"), table_name="auth_password_resets")
    op.drop_table("auth_password_resets")

