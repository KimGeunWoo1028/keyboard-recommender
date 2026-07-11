"""
SQLAlchemy declarative base for ORM models.

All table classes should inherit from `Base`. Import `Base` in `models/*.py` when
you add real tables; Alembic will use the same metadata.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Metadata registry for all ORM models in this app."""
