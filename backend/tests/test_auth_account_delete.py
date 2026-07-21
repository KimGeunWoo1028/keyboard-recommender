"""Phase 1–2 / 1b — POST /auth/account/delete (password + email code + purge)."""

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
    AuthAccountDeletionChallenge,
    AuthEmailVerification,
    AuthSession,
    User,
)
from keyboard_recommender.recommendation_quality.evaluation.storage.event_models import (
    EvalBenchmarkRun,
    EvalEvent,
    EvalRecommendationRun,
)
from keyboard_recommender.security.passwords import hash_password
from keyboard_recommender.security.sessions import new_session_token_id

_PASSWORD = "Abcd123!"
_WRONG_PASSWORD = "Wrong123!"
_PG = "postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender"

_AUTH_TABLES = (
    User.__table__,
    AuthSession.__table__,
    AuthEmailVerification.__table__,
    AuthAccountDeletionChallenge.__table__,
    EvalRecommendationRun.__table__,
    EvalBenchmarkRun.__table__,
    EvalEvent.__table__,
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


def _seed_user(
    session: Session,
    *,
    email: str = "delete-me@example.com",
    display_name: str = "deleteme",
) -> tuple[User, str]:
    now = datetime.now(timezone.utc)
    user = User(
        id=uuid.uuid4(),
        email=email,
        password_hash=hash_password(_PASSWORD),
        display_name=display_name,
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


def _seed_eval_event(session: Session, *, user_id: str | None, event_type: str = "interaction.bookmark") -> EvalEvent:
    now = datetime.now(timezone.utc)
    row = EvalEvent(
        id=uuid.uuid4(),
        created_at=now,
        event_type=event_type,
        correlation_id="req-1",
        payload={
            "event_type": event_type,
            "user_id": user_id,
            "metadata": {"userId": user_id, "buildId": "build-a"},
        },
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def _verify_deletion_code(client: TestClient, settings: Settings, token_id: str) -> str:
    client.cookies.set(settings.auth_cookie_name, token_id)
    send = client.post("/api/v1/auth/account/deletion-code/send")
    assert send.status_code == 200
    code = send.json().get("debug_code")
    assert code
    verify = client.post("/api/v1/auth/account/deletion-code/verify", json={"code": code})
    assert verify.status_code == 200
    token = verify.json().get("verification_token")
    assert token
    return str(token)


def test_delete_account_unauthenticated(auth_env: tuple[TestClient, Session, Settings]) -> None:
    client, _session, settings = auth_env
    res = client.post(
        "/api/v1/auth/account/delete",
        json={"password": _PASSWORD, "verification_token": "x" * 32},
    )
    assert res.status_code == 401
    assert settings.auth_cookie_name not in (res.cookies or {})


def test_delete_account_without_verification_token_rejected(
    auth_env: tuple[TestClient, Session, Settings],
) -> None:
    client, session, settings = auth_env
    user, token_id = _seed_user(session)
    client.cookies.set(settings.auth_cookie_name, token_id)
    res = client.post("/api/v1/auth/account/delete", json={"password": _PASSWORD})
    assert res.status_code == 422
    assert session.execute(select(User).where(User.id == user.id)).scalar_one_or_none() is not None


def test_delete_account_wrong_password_keeps_user(auth_env: tuple[TestClient, Session, Settings]) -> None:
    client, session, settings = auth_env
    user, token_id = _seed_user(session)
    verification_token = _verify_deletion_code(client, settings, token_id)
    res = client.post(
        "/api/v1/auth/account/delete",
        json={"password": _WRONG_PASSWORD, "verification_token": verification_token},
    )
    assert res.status_code == 401
    assert session.execute(select(User).where(User.id == user.id)).scalar_one_or_none() is not None
    assert session.execute(select(AuthSession).where(AuthSession.user_id == user.id)).scalar_one_or_none() is not None


def test_delete_account_wrong_code_rejected(auth_env: tuple[TestClient, Session, Settings]) -> None:
    client, session, settings = auth_env
    user, token_id = _seed_user(session)
    client.cookies.set(settings.auth_cookie_name, token_id)
    assert client.post("/api/v1/auth/account/deletion-code/send").status_code == 200
    bad = client.post("/api/v1/auth/account/deletion-code/verify", json={"code": "000000"})
    assert bad.status_code == 400
    assert session.execute(select(User).where(User.id == user.id)).scalar_one_or_none() is not None


def test_delete_account_success_clears_user_session_and_cookie(
    auth_env: tuple[TestClient, Session, Settings],
) -> None:
    client, session, settings = auth_env
    user, token_id = _seed_user(session)
    avatar = Path(settings.avatar_upload_dir) / f"{user.id}.png"
    avatar.parent.mkdir(parents=True, exist_ok=True)
    avatar.write_bytes(b"\x89PNG\r\n\x1a\n" + b"0" * 16)

    verification_token = _verify_deletion_code(client, settings, token_id)
    res = client.post(
        "/api/v1/auth/account/delete",
        json={"password": _PASSWORD, "verification_token": verification_token},
    )
    assert res.status_code == 204
    assert session.execute(select(User).where(User.id == user.id)).scalar_one_or_none() is None
    assert session.execute(select(AuthSession).where(AuthSession.token_id == token_id)).scalar_one_or_none() is None
    assert not avatar.exists()

    set_cookie = res.headers.get("set-cookie") or ""
    assert settings.auth_cookie_name in set_cookie.lower() or res.cookies.get(settings.auth_cookie_name) in ("", None)

    # Phase 4 — cookie cleared: subsequent /me is unauthenticated (hard-refresh equivalent).
    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json().get("user") is None


def test_delete_account_anonymizes_eval_events_and_keeps_other_user(
    auth_env: tuple[TestClient, Session, Settings],
) -> None:
    client, session, settings = auth_env
    user, token_id = _seed_user(session)
    other, _ = _seed_user(session, email="keep@example.com", display_name="keepme")
    own_event = _seed_eval_event(session, user_id=str(user.id))
    other_event = _seed_eval_event(session, user_id=str(other.id))

    now = datetime.now(timezone.utc)
    session.add(
        AuthEmailVerification(
            id=uuid.uuid4(),
            email=user.email,
            code_hash="x",
            expires_at=now + timedelta(minutes=10),
            created_at=now,
            updated_at=now,
        ),
    )
    session.commit()

    verification_token = _verify_deletion_code(client, settings, token_id)
    res = client.post(
        "/api/v1/auth/account/delete",
        json={"password": _PASSWORD, "verification_token": verification_token},
    )
    assert res.status_code == 204

    session.expire_all()
    own = session.execute(select(EvalEvent).where(EvalEvent.id == own_event.id)).scalar_one()
    assert own.payload.get("user_id") is None
    assert (own.payload.get("metadata") or {}).get("userId") is None
    assert own.payload.get("event_type") == "interaction.bookmark"

    kept = session.execute(select(EvalEvent).where(EvalEvent.id == other_event.id)).scalar_one()
    assert kept.payload.get("user_id") == str(other.id)
    assert (kept.payload.get("metadata") or {}).get("userId") == str(other.id)

    assert (
        session.execute(select(AuthEmailVerification).where(AuthEmailVerification.email == "delete-me@example.com")).scalar_one_or_none()
        is None
    )
    assert session.execute(select(User).where(User.id == other.id)).scalar_one_or_none() is not None


def test_delete_account_session_gone_cannot_list_saved(
    auth_env: tuple[TestClient, Session, Settings],
) -> None:
    client, session, settings = auth_env
    user, token_id = _seed_user(session)
    _seed_eval_event(session, user_id=str(user.id))

    verification_token = _verify_deletion_code(client, settings, token_id)
    assert (
        client.post(
            "/api/v1/auth/account/delete",
            json={"password": _PASSWORD, "verification_token": verification_token},
        ).status_code
        == 204
    )

    # Cookie cleared — saved listing without auth should not expose former user's builds.
    client.cookies.clear()
    saved = client.get("/api/v1/recommendations/saved")
    assert saved.status_code in {200, 401}
    if saved.status_code == 200:
        body = saved.json()
        items = body.get("items") or body.get("saved") or []
        assert items == []


def test_send_account_deleted_email_log_fallback(caplog: pytest.LogCaptureFixture) -> None:
    from keyboard_recommender.infrastructure.notifications.email import send_account_deleted_email

    settings = Settings(
        app_environment="local",
        debug=True,
        database_url=_PG,
        email_provider="smtp",
        smtp_host=None,
        smtp_from_email=None,
    )
    with caplog.at_level("INFO"):
        delivery = send_account_deleted_email(settings, to_email="gone@example.com")
    assert delivery == "log"
    assert any("account_deleted_fallback_log" in r.message and "gone@example.com" in r.message for r in caplog.records)


def test_delete_account_sends_completion_email_best_effort(
    auth_env: tuple[TestClient, Session, Settings],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client, session, settings = auth_env
    user, token_id = _seed_user(session)
    calls: list[str] = []

    def _fake_send(s: Settings, *, to_email: str) -> str:
        del s
        calls.append(to_email)
        return "log"

    monkeypatch.setattr(
        "keyboard_recommender.api.v1.auth.send_account_deleted_email",
        _fake_send,
    )
    verification_token = _verify_deletion_code(client, settings, token_id)
    res = client.post(
        "/api/v1/auth/account/delete",
        json={"password": _PASSWORD, "verification_token": verification_token},
    )
    assert res.status_code == 204
    assert calls == ["delete-me@example.com"]
    assert session.execute(select(User).where(User.id == user.id)).scalar_one_or_none() is None


def test_send_account_deleted_email_never_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    """L4=B — provider exceptions become log fallback, never propagate."""
    from keyboard_recommender.infrastructure.notifications import email as email_mod

    settings = Settings(app_environment="local", debug=True, database_url=_PG, email_provider="smtp")

    def _boom(*_a: object, **_k: object) -> str:
        raise RuntimeError("smtp down")

    monkeypatch.setattr(email_mod, "_deliver_email", _boom)
    assert email_mod.send_account_deleted_email(settings, to_email="x@example.com") == "log"
