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
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Register all ORM tables on shared metadata (catalog + evaluation).
import keyboard_recommender.infrastructure.persistence.models  # noqa: E402, F401
import keyboard_recommender.recommendation_quality.evaluation.storage.event_models  # noqa: E402, F401
