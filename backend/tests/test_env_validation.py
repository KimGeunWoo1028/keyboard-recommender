"""Startup / deployment environment validation rules."""

from __future__ import annotations

import pytest
from pydantic_settings import SettingsConfigDict

from keyboard_recommender.config.env_validation import (
    ConfigurationError,
    validate_environment_configuration,
    _production_issues,
    _staging_issues,
)
from keyboard_recommender.config.settings import Settings

_PG_REMOTE = "postgresql+psycopg://deploy:deploy_secret@db.internal:5432/keyboard_recommender"
_PG_LOCAL = "postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender"


class IsolatedSettings(Settings):
    """No ``backend/.env`` (deterministic unit tests)."""

    model_config = SettingsConfigDict(
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
        env_file=None,
    )


def _smtp_prod_ready(s: IsolatedSettings) -> IsolatedSettings:
    return s.model_copy(
        update={
            "email_provider": "smtp",
            "smtp_host": "smtp.example.com",
            "smtp_username": "u",
            "smtp_password": "p",
            "smtp_from_email": "noreply@example.com",
        },
    )


def test_production_issues_require_https() -> None:
    s = IsolatedSettings(
        app_environment="production",
        database_url=_PG_REMOTE,
        cors_origins="http://app.example.com",
        public_frontend_base_url="https://app.example.com",
    )
    s = _smtp_prod_ready(s)
    msgs = _production_issues(s)
    assert any("HTTPS" in m and "app.example.com" in m for m in msgs)


def test_production_issues_reject_local_db() -> None:
    s = _smtp_prod_ready(
        IsolatedSettings(
            app_environment="production",
            database_url=_PG_LOCAL,
            cors_origins="https://app.example.com",
            public_frontend_base_url="https://app.example.com",
        ),
    )
    msgs = _production_issues(s)
    assert any("localhost" in m.lower() or "127.0.0.1" in m for m in msgs)


def test_production_issues_reject_default_db_creds() -> None:
    s = _smtp_prod_ready(
        IsolatedSettings(
            app_environment="production",
            database_url="postgresql+psycopg://keyboard:keyboard@db.internal:5432/prod",
            cors_origins="https://app.example.com",
            public_frontend_base_url="https://app.example.com",
        ),
    )
    msgs = _production_issues(s)
    assert any("default dev" in m.lower() for m in msgs)


def test_staging_issues_require_https_non_local() -> None:
    msgs = _staging_issues(
        IsolatedSettings(
            app_environment="staging",
            database_url=_PG_REMOTE,
            cors_origins="http://app.staging.example.com",
            public_frontend_base_url="https://app.staging.example.com",
        ),
    )
    assert any("CORS" in m and "HTTPS" in m for m in msgs)


def test_staging_localhost_stack_allowed() -> None:
    assert (
        _staging_issues(
            IsolatedSettings(
                app_environment="staging",
                database_url=_PG_LOCAL,
                cors_origins="http://localhost:3000",
                public_frontend_base_url="http://localhost:3000",
            ),
        )
        == []
    )


def test_validate_raises_when_pytest_env_removed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    with pytest.raises(ConfigurationError, match="HTTPS"):
        validate_environment_configuration(
            _smtp_prod_ready(
                IsolatedSettings(
                    app_environment="production",
                    database_url=_PG_REMOTE,
                    cors_origins="http://app.example.com",
                    public_frontend_base_url="https://app.example.com",
                ),
            ),
        )


def test_validate_skips_deployment_checks_under_pytest() -> None:
    """When PYTEST_CURRENT_TEST is set, production deployment checks are skipped (see env_validation)."""
    validate_environment_configuration(
        _smtp_prod_ready(
            IsolatedSettings(
                app_environment="production",
                database_url=_PG_LOCAL,
                cors_origins="http://localhost:3000",
                public_frontend_base_url="http://localhost:3000",
            ),
        ),
    )
