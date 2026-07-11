"""
FastAPI dependencies (dependency injection).

Routers use `Depends(get_db)` to receive a database session that is always closed
after the request.
"""

import hashlib
import hmac
from datetime import datetime, timezone
from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from keyboard_recommender.config.settings import Settings, get_settings
from keyboard_recommender.infrastructure.persistence.models.user_auth import AuthSession, User
from keyboard_recommender.infrastructure.persistence.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Yield one SQLAlchemy session per request; close it when done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_settings_dep() -> Settings:
    """Expose settings to routes via `Depends`."""
    return get_settings()


SettingsDep = Annotated[Settings, Depends(get_settings_dep)]
DbSession = Annotated[Session, Depends(get_db)]


def get_db_for_evaluation(
    settings: Settings = Depends(get_settings_dep),
) -> Generator[Session | None, None, None]:
    """
    Yield a DB session only when evaluation persistence is enabled.

    Keeps ``POST /recommendations/compute`` free of DB connections when persistence is off.
    """
    if not settings.enable_evaluation_persistence:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


EvaluationDbSession = Annotated[Session | None, Depends(get_db_for_evaluation)]


def _debug_token_matches(provided: str | None, expected: str) -> bool:
    """Constant-time compare of UTF-8 secrets via SHA-256 digests (handles unequal lengths)."""
    if provided is None:
        return False
    digest = hashlib.sha256
    return hmac.compare_digest(
        digest(provided.strip().encode("utf-8")).digest(),
        digest(expected.strip().encode("utf-8")).digest(),
    )


def require_internal_debug_api(
    settings: SettingsDep,
    x_internal_debug_token: Annotated[str | None, Header(alias="X-Internal-Debug-Token")] = None,
) -> None:
    """
    Gate ``/api/v1/debug/*``.

    * API disabled → **404** (hide surface).
    * Token configured → header must match.
    * No token → only allowed when ``settings.debug`` is true (local dev).
    """
    if settings.app_environment == "production":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")
    if not settings.internal_debug_api_enabled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")
    expected = (settings.internal_debug_token or "").strip()
    if expected:
        if not _debug_token_matches(x_internal_debug_token, expected):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    elif not settings.debug:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")


InternalDebugDep = Annotated[None, Depends(require_internal_debug_api)]


def get_current_user_optional(
    request: Request,
    db: DbSession,
    settings: SettingsDep,
) -> User | None:
    """
    Resolve current user from auth session cookie.

    Reads cookie using configured ``settings.auth_cookie_name``.
    """
    token_id = (request.cookies.get(settings.auth_cookie_name) or "").strip()
    if not token_id:
        return None
    now = datetime.now(timezone.utc)
    session = db.execute(
        select(AuthSession).where(
            AuthSession.token_id == token_id,
            AuthSession.expires_at > now,
        ),
    ).scalar_one_or_none()
    if session is None:
        return None
    return db.execute(select(User).where(User.id == session.user_id)).scalar_one_or_none()


CurrentUserOptionalDep = Annotated[User | None, Depends(get_current_user_optional)]
