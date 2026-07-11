"""Add email verification table for signup challenge flow.

Revision ID: 005_auth_email_verifications
Revises: 004_auth_sessions
Create Date: 2026-05-07
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "005_auth_email_verifications"
down_revision: Union[str, None] = "004_auth_sessions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "auth_email_verifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("code_hash", sa.Text(), nullable=False),
        sa.Column("verification_token", sa.String(length=128), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_auth_email_verifications_email"),
    )
    op.create_index(op.f("ix_auth_email_verifications_email"), "auth_email_verifications", ["email"])
    op.create_index(op.f("ix_auth_email_verifications_expires_at"), "auth_email_verifications", ["expires_at"])


def downgrade() -> None:
    op.drop_index(op.f("ix_auth_email_verifications_expires_at"), table_name="auth_email_verifications")
    op.drop_index(op.f("ix_auth_email_verifications_email"), table_name="auth_email_verifications")
    op.drop_table("auth_email_verifications")

