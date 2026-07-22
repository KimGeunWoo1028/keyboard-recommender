from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

import uvicorn
from sqlalchemy import create_engine, event, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from keyboard_recommender.api.deps import get_db, get_db_for_evaluation, get_settings_dep
from keyboard_recommender.app_factory import create_app
from keyboard_recommender.config.settings import Settings
from keyboard_recommender.infrastructure.persistence.base import Base
from keyboard_recommender.infrastructure.persistence.models.user_auth import (
    AuthAccountDeletionChallenge,
    AuthEmailVerification,
    AuthPasswordChangeChallenge,
    AuthPasswordReset,
    AuthSession,
    User,
)
from keyboard_recommender.recommendation_quality.evaluation.storage.event_models import (
    EvalBenchmarkRun,
    EvalConfidenceSample,
    EvalDiagnostics,
    EvalEvent,
    EvalMetrics,
    EvalRecommendationRun,
    EvalSnapshot,
)
from keyboard_recommender.security.passwords import hash_password

_PG_PLACEHOLDER = "postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender"
_DB_PATH = Path(__file__).resolve().parents[1] / "local-pass1.db"

_AUTH_TABLES = (
    User.__table__,
    AuthSession.__table__,
    AuthEmailVerification.__table__,
    AuthPasswordReset.__table__,
    AuthAccountDeletionChallenge.__table__,
    AuthPasswordChangeChallenge.__table__,
)

_EVAL_TABLES = (
    EvalRecommendationRun.__table__,
    EvalSnapshot.__table__,
    EvalMetrics.__table__,
    EvalDiagnostics.__table__,
    EvalConfidenceSample.__table__,
    EvalBenchmarkRun.__table__,
    EvalEvent.__table__,
)


def _build_session_factory() -> sessionmaker[Session]:
    engine = create_engine(
        f"sqlite+pysqlite:///{_DB_PATH.as_posix()}",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _fk(dbapi_connection, connection_record):  # type: ignore[no-untyped-def]
        cur = dbapi_connection.cursor()
        cur.execute("pragma foreign_keys=ON")
        cur.close()

    Base.metadata.create_all(engine, tables=[*_AUTH_TABLES, *_EVAL_TABLES])
    return sessionmaker(bind=engine, future=True)


def _seed_test_user(session_factory: sessionmaker[Session]) -> None:
    with session_factory() as session:
        user = session.execute(select(User).where(User.email == "keyboardrecommendertest@gmail.com")).scalar_one_or_none()
        now = datetime.now(timezone.utc)
        if user is None:
            user = User(
                id=uuid.uuid4(),
                email="keyboardrecommendertest@gmail.com",
                password_hash=hash_password("testtest123!"),
                display_name="test2",
                avatar_url=None,
                created_at=now,
                updated_at=now,
            )
            session.add(user)
        else:
            user.password_hash = hash_password("testtest123!")
            user.display_name = "test2"
            user.updated_at = now
        session.commit()


def main() -> None:
    session_factory = _build_session_factory()
    _seed_test_user(session_factory)

    settings = Settings(
        app_environment="local",
        debug=True,
        database_url=_PG_PLACEHOLDER,
        cors_origins="http://localhost:3000",
        public_frontend_base_url="http://localhost:3000",
        auth_cookie_secure=False,
        enable_evaluation_persistence=True,
    )

    app = create_app(settings=settings)

    def override_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_db_for_evaluation] = override_db
    app.dependency_overrides[get_settings_dep] = lambda: settings

    uvicorn.run(app, host="127.0.0.1", port=8010, log_level="info")


if __name__ == "__main__":
    main()
