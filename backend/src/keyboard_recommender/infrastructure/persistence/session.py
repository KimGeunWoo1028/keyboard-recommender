"""
Database engine and session factory.

- `engine`: connection pool to PostgreSQL
- `SessionLocal`: factory for short-lived `Session` objects (one per request in FastAPI)
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from keyboard_recommender.config.settings import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_timeout=settings.database_pool_timeout_seconds,
    pool_recycle=settings.database_pool_recycle_seconds,
    pool_use_lifo=True,
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Register all ORM tables on shared metadata (catalog + evaluation).
import keyboard_recommender.infrastructure.persistence.models  # noqa: E402, F401
import keyboard_recommender.recommendation_quality.evaluation.storage.event_models  # noqa: E402, F401
