"""Auth cookie / HTTPS-related settings behavior."""

from __future__ import annotations

import pytest
from pydantic_settings import SettingsConfigDict

from keyboard_recommender.config.settings import Settings

_PG = "postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender"


class IsolatedSettings(Settings):
    """Same as Settings but does not read ``backend/.env`` (tests stay deterministic on dev machines)."""

    model_config = SettingsConfigDict(
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
        env_file=None,
    )


@pytest.fixture(autouse=True)
def _clear_cookie_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Extra isolation when subprocess env leaks AUTH_* / APP_* vars."""
    for key in (
        "AUTH_COOKIE_SECURE",
        "AUTH_COOKIE_SAMESITE",
        "AUTH_COOKIE_DOMAIN",
        "APP_ENV",
        "APP_ENVIRONMENT",
    ):
        monkeypatch.delenv(key, raising=False)


def test_local_defaults_insecure_cookie() -> None:
    s = IsolatedSettings(app_environment="local", database_url=_PG)
    assert s.auth_cookie_secure is False
    assert s.auth_cookie_samesite == "lax"


def test_staging_defaults_secure_when_unset() -> None:
    s = IsolatedSettings(app_environment="staging", database_url=_PG)
    assert s.auth_cookie_secure is True


def test_staging_respects_explicit_insecure() -> None:
    s = IsolatedSettings(app_environment="staging", auth_cookie_secure=False, database_url=_PG)
    assert s.auth_cookie_secure is False


def test_production_requires_secure() -> None:
    with pytest.raises(ValueError, match="production requires secure"):
        IsolatedSettings(app_environment="production", auth_cookie_secure=False, database_url=_PG)


def test_samesite_none_requires_secure() -> None:
    with pytest.raises(ValueError, match="SameSite=None"):
        IsolatedSettings(
            app_environment="staging",
            auth_cookie_secure=False,
            auth_cookie_samesite="none",
            database_url=_PG,
        )


def test_auth_cookie_domain_blank_normalized() -> None:
    s = IsolatedSettings(app_environment="local", auth_cookie_domain="  ", database_url=_PG)
    assert s.auth_cookie_domain is None
