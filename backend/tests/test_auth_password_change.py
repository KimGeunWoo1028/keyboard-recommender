"""POST /auth/change-password requires email verification_token."""

from __future__ import annotations

import uuid
from collections.abc import Generator
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from keyboard_recommender.api.deps import get_db, get_settings_dep
from keyboard_recommender.app_factory import create_app
from keyboard_recommender.config.settings import Settings
from keyboard_recommender.infrastructure.persistence.base import Base
from keyboard_recommender.infrastructure.persistence.models.user_auth import (
    AuthPasswordChangeChallenge,
    AuthSession,
    User,
)
from keyboard_recommender.security.passwords import hash_password, verify_password
from keyboard_recommender.security.sessions import new_session_token_id

_PASSWORD = "Abcd123!"
_NEW_PASSWORD = "NewPass9!"
_WRONG_PASSWORD = "Wrong123!"
_PG = "postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender"

_AUTH_TABLES = (
    User.__table__,
    AuthSession.__table__,
    AuthPasswordChangeChallenge.__table__,
)


@pytest.fixture
def auth_env(tmp_path: Path) -> Generator[tuple[TestClient, Session, Settings], None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _fk(dbapi_connection, connection_record):  # type: ignore[no-untyped-def]
        cur = dbapi_connection.cursor()
        cur.execute("pragma foreign_keys=ON")
        cur.close()

    Base.metadata.create_all(engine, tables=list(_AUTH_TABLES))
    SessionLocal = sessionmaker(bind=engine, future=True)
    session = SessionLocal()

    settings = Settings(
        app_environment="local",
        debug=True,
        database_url=_PG,
        avatar_upload_dir=str(tmp_path / "avatars"),
        enable_evaluation_persistence=False,
    )

    def override_db() -> Generator[Session, None, None]:
        try:
            yield session
        finally:
            session.expire_all()

    app = create_app(settings=settings)
    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_settings_dep] = lambda: settings
    client = TestClient(app)
    yield client, session, settings
    client.close()
    session.close()
    app.dependency_overrides.clear()


def _seed_user(session: Session) -> tuple[User, str]:
    now = datetime.now(timezone.utc)
    user = User(
        id=uuid.uuid4(),
        email="change-pw@example.com",
        password_hash=hash_password(_PASSWORD),
        display_name="changepw",
        created_at=now,
        updated_at=now,
    )
    token_id = new_session_token_id()
    session.add(user)
    session.flush()
    session.add(
        AuthSession(
            id=uuid.uuid4(),
            user_id=user.id,
            token_id=token_id,
            expires_at=now + timedelta(hours=12),
            created_at=now,
        ),
    )
    session.commit()
    session.refresh(user)
    return user, token_id


def _verify_password_change_code(client: TestClient, settings: Settings, token_id: str) -> str:
    client.cookies.set(settings.auth_cookie_name, token_id)
    send = client.post("/api/v1/auth/change-password-code/send")
    assert send.status_code == 200
    code = send.json().get("debug_code")
    assert code
    verify = client.post("/api/v1/auth/change-password-code/verify", json={"code": code})
    assert verify.status_code == 200
    token = verify.json().get("verification_token")
    assert token
    return str(token)


def test_change_password_requires_verification_token(auth_env: tuple[TestClient, Session, Settings]) -> None:
    client, session, settings = auth_env
    _user, token_id = _seed_user(session)
    client.cookies.set(settings.auth_cookie_name, token_id)
    res = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": _PASSWORD, "new_password": _NEW_PASSWORD},
    )
    assert res.status_code == 422


def test_change_password_without_email_verify_rejected(auth_env: tuple[TestClient, Session, Settings]) -> None:
    client, session, settings = auth_env
    user, token_id = _seed_user(session)
    client.cookies.set(settings.auth_cookie_name, token_id)
    res = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": _PASSWORD,
            "new_password": _NEW_PASSWORD,
            "verification_token": "x" * 32,
        },
    )
    assert res.status_code == 400
    session.refresh(user)
    assert verify_password(_PASSWORD, user.password_hash)


def test_change_password_wrong_code_rejected(auth_env: tuple[TestClient, Session, Settings]) -> None:
    client, session, settings = auth_env
    _user, token_id = _seed_user(session)
    client.cookies.set(settings.auth_cookie_name, token_id)
    assert client.post("/api/v1/auth/change-password-code/send").status_code == 200
    bad = client.post("/api/v1/auth/change-password-code/verify", json={"code": "000000"})
    assert bad.status_code == 400


def test_change_password_success_consumes_challenge(auth_env: tuple[TestClient, Session, Settings]) -> None:
    client, session, settings = auth_env
    user, token_id = _seed_user(session)
    verification_token = _verify_password_change_code(client, settings, token_id)
    res = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": _PASSWORD,
            "new_password": _NEW_PASSWORD,
            "verification_token": verification_token,
        },
    )
    assert res.status_code == 204
    session.refresh(user)
    assert verify_password(_NEW_PASSWORD, user.password_hash)
    challenge = session.execute(
        select(AuthPasswordChangeChallenge).where(AuthPasswordChangeChallenge.user_id == user.id),
    ).scalar_one()
    assert challenge.consumed_at is not None

    reuse = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": _NEW_PASSWORD,
            "new_password": _PASSWORD,
            "verification_token": verification_token,
        },
    )
    assert reuse.status_code == 400


def test_change_password_wrong_current_keeps_hash(auth_env: tuple[TestClient, Session, Settings]) -> None:
    client, session, settings = auth_env
    user, token_id = _seed_user(session)
    verification_token = _verify_password_change_code(client, settings, token_id)
    res = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": _WRONG_PASSWORD,
            "new_password": _NEW_PASSWORD,
            "verification_token": verification_token,
        },
    )
    assert res.status_code == 401
    session.refresh(user)
    assert verify_password(_PASSWORD, user.password_hash)
