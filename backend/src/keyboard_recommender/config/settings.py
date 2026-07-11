"""
Application configuration loaded from environment variables and optional `.env` file.

`pydantic-settings` reads `DATABASE_URL`, `CORS_ORIGINS`, etc. from the process
environment. Names are uppercase by convention; fields here use lower_snake_case.
"""

from __future__ import annotations

from functools import lru_cache
import re
from pathlib import Path
from typing import Any, Literal

from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Always resolve `backend/.env` (not CWD) so Alembic works from any directory.
_BACKEND_ROOT = Path(__file__).resolve().parents[3]
_ENV_FILE = _BACKEND_ROOT / ".env"

_settings_kwargs: dict = {
    "env_file_encoding": "utf-8",
    "extra": "ignore",
    # Allow ``Settings(app_environment=...)`` alongside ``APP_ENV`` / ``APP_ENVIRONMENT`` env aliases.
    "populate_by_name": True,
}
if _ENV_FILE.is_file():
    _settings_kwargs["env_file"] = _ENV_FILE


def _settings_tier_from_dict(data: dict[str, Any]) -> str:
    tier = data.get("app_environment")
    if tier is None:
        tier = data.get("APP_ENV") or data.get("APP_ENVIRONMENT")
    return str(tier or "local").lower()


def resolved_env_file_path() -> Path:
    """Absolute path to the ``.env`` file that :class:`Settings` tries to load (may be missing)."""
    return _ENV_FILE


class Settings(BaseSettings):
    """Central place for all config. Change values via env vars, not by editing code."""

    model_config = SettingsConfigDict(**_settings_kwargs)

    # App
    app_name: str = "Keyboard Recommender API"
    app_version: str = "0.1.0"
    debug: bool = False

    app_environment: Literal["local", "development", "staging", "production"] = Field(
        default="local",
        validation_alias=AliasChoices("app_environment", "APP_ENV", "APP_ENVIRONMENT"),
        description="Deployment tier; ``production`` enforces stricter debug and logging defaults.",
    )

    # PostgreSQL (SQLAlchemy URL — use psycopg v3 driver)
    database_url: str = "postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender"

    # CORS: comma-separated list. Prefer one dev origin to avoid session confusion (localhost vs 127.0.0.1).
    cors_origins: str = "http://localhost:3000"

    # Cookie-session auth (lightweight account auth).
    auth_cookie_name: str = "kr_session"
    auth_session_ttl_hours: int = Field(
        default=24 * 30,
        description="Session TTL in hours when auth_session_ttl_minutes is unset.",
    )

    auth_session_ttl_minutes: int | None = Field(
        default=None,
        ge=1,
        description="If set, session and cookie lifetime in minutes (overrides auth_session_ttl_hours).",
    )
    auth_cookie_secure: bool = Field(
        default=False,
        description="AUTH_COOKIE_SECURE. Defaults to true for staging/production when unset (see validators).",
    )

    auth_cookie_domain: str | None = Field(
        default=None,
        description="Optional ``Set-Cookie`` ``Domain`` (e.g. ``.example.com``). Omit for host-only cookies.",
    )
    auth_cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    auth_email_code_ttl_minutes: int = 10

    email_provider: Literal["smtp", "resend"] = "smtp"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_use_tls: bool = True
    resend_api_key: str | None = None
    resend_from_email: str | None = None
    auth_password_reset_ttl_minutes: int = 30
    public_frontend_base_url: str = "http://localhost:3000"

    # Profile avatars (uploaded images served from /media/avatars)
    avatar_upload_dir: str = Field(
        default=str(_BACKEND_ROOT / "data" / "avatars"),
        description="Directory for user-uploaded profile photos.",
    )
    avatar_max_bytes: int = Field(default=2 * 1024 * 1024, ge=64 * 1024, description="Max avatar upload size in bytes.")

    # Swagkey catalog thumbnails mirrored from CDN (served from /media/swagkey-images)
    swagkey_images_dir: str = Field(
        default=str(_BACKEND_ROOT / "data" / "swagkey_images"),
        description="Directory for locally mirrored Swagkey product thumbnails.",
    )

    # Evaluation persistence (opt-in; failures must never break recommendation responses)
    enable_evaluation_persistence: bool = False
    """When true, successful ``POST /recommendations/compute`` may write to ``eval_*`` tables."""

    enable_unified_event_ingestion: bool = True
    """When true (and persistence is on), append unified analytics rows to ``eval_events`` (best-effort)."""

    enable_feedback_learning_mvp: bool = False
    """When true, apply small rule-based boosts/penalties from recent ``eval_events`` interactions."""

    feedback_learning_max_events: int = 400
    feedback_learning_click_boost: float = 0.012
    feedback_learning_save_boost: float = 0.022
    feedback_learning_comparison_boost: float = 0.008
    feedback_learning_dislike_penalty: float = 0.028
    feedback_learning_max_part_mult: float = 1.1
    feedback_learning_min_part_mult: float = 0.9
    feedback_learning_trait_nudge_cap: float = 0.12
    feedback_learning_family_axis_scale: float = 0.02
    feedback_learning_diversity_step: float = 0.0025
    feedback_learning_diversity_cap_delta: float = 0.05
    feedback_learning_temporal_decay_per_step: float = 0.997
    feedback_learning_min_weighted_mass: float = 2.5
    feedback_learning_collection_hint_scale: float = 0.22
    feedback_learning_acceptance_extra_boost: float = 0.006
    feedback_learning_rejection_extra_penalty: float = 0.006
    feedback_learning_refinement_diversity_step: float = 0.002
    feedback_learning_tactile_uncertainty_min_comparisons: float = 3.0
    feedback_learning_tactile_uncertainty_min_family: float = 1.25
    feedback_learning_tactile_uncertainty_nudge: float = 0.035

    # Operational automation: drift/evaluation thresholds -> reversible runtime controls.
    enable_operational_automation: bool = False
    enable_operational_alerting: bool = True
    operational_alert_webhook_url: str | None = None
    operational_monitor_window: int = 48
    operational_threshold_confidence_min_mean: float = 0.58
    operational_threshold_diversity_min_mean: float = 0.18
    operational_threshold_compatibility_min_mean: float = 0.60
    operational_threshold_reranking_max_mean: float = 0.52
    operational_default_enable_reranking: bool = True
    operational_default_enable_fallback: bool = True
    operational_default_enable_feedback_weighting: bool = True
    operational_default_model_version: str = "stable_v2"

    enable_evaluation_snapshots: bool = True
    """When persistence is on: store full snapshot JSON. If false, large fields (e.g. ranked lists) are stripped."""

    enable_diagnostics_persistence: bool = True
    """When persistence is on: store full diagnostics JSON. If false, store a minimal redacted diagnostics row."""

    evaluation_persistence_force_failure: bool = False
    """Test-only: raise inside persistence hook so callers verify compute still succeeds (swallowed + logged)."""

    # Scaling/runtime optimization controls.
    scaling_profile: Literal["custom", "low", "medium", "high"] = "custom"
    enable_recommendation_cache: bool = True
    recommendation_cache_ttl_seconds: int = 45
    recommendation_cache_max_size: int = 1024
    enable_async_diagnostics_offload: bool = True
    enable_batch_evaluation_pipeline: bool = True
    evaluation_batch_size: int = 64
    evaluation_batch_flush_interval_seconds: int = 2
    enable_resilient_compute_fallback: bool = True

    @model_validator(mode="before")
    @classmethod
    def apply_scaling_profile_defaults(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        profile = str(data.get("scaling_profile", data.get("SCALING_PROFILE", "custom"))).lower()
        if profile not in {"low", "medium", "high"}:
            return data
        merged = dict(data)
        if profile == "low":
            merged.update(
                {
                    "recommendation_cache_ttl_seconds": 20,
                    "recommendation_cache_max_size": 512,
                    "evaluation_batch_size": 24,
                    "evaluation_batch_flush_interval_seconds": 1,
                },
            )
        elif profile == "medium":
            merged.update(
                {
                    "recommendation_cache_ttl_seconds": 45,
                    "recommendation_cache_max_size": 1024,
                    "evaluation_batch_size": 64,
                    "evaluation_batch_flush_interval_seconds": 2,
                },
            )
        else:  # high
            merged.update(
                {
                    "recommendation_cache_ttl_seconds": 90,
                    "recommendation_cache_max_size": 4096,
                    "evaluation_batch_size": 256,
                    "evaluation_batch_flush_interval_seconds": 3,
                },
            )
        return merged

    # Internal HTTP debug API (never expose publicly without token + explicit enable)
    internal_debug_api_enabled: bool = False
    """Set ``INTERNAL_DEBUG_API_ENABLED=true`` to mount ``/api/v1/debug/*`` (still requires token unless ``debug``)."""

    internal_debug_token: str | None = None
    """Optional shared secret; clients send ``X-Internal-Debug-Token``. If unset, only ``debug=true`` may use the API."""

    @model_validator(mode="before")
    @classmethod
    def production_safety_coercion(cls, data: Any) -> Any:
        """
        In ``production``, force unsafe developer switches off so mis-set env cannot expose debug HTTP.

        Implemented as a **before** validator so ``BaseSettings.__init__`` reliably applies coercions
        (``mode='after'`` + ``model_copy`` is not consistently honored on settings instances).
        """
        if not isinstance(data, dict):
            return data
        if _settings_tier_from_dict(data) != "production":
            return data
        merged = dict(data)
        merged["internal_debug_api_enabled"] = False
        merged["debug"] = False
        merged["evaluation_persistence_force_failure"] = False
        return merged

    @model_validator(mode="before")
    @classmethod
    def coerce_secure_cookie_default_by_tier(cls, data: Any) -> Any:
        """
        Default ``AUTH_COOKIE_SECURE=true`` for ``staging`` and ``production`` when the env var is absent,
        so HTTPS deployments are safe without an extra env line. Local/dev keep ``false`` for plain HTTP.
        """
        if not isinstance(data, dict):
            return data
        tier = _settings_tier_from_dict(data)
        if tier not in ("staging", "production"):
            return data
        if "auth_cookie_secure" in data or "AUTH_COOKIE_SECURE" in data:
            return data
        merged = dict(data)
        merged["auth_cookie_secure"] = True
        return merged

    @field_validator("auth_session_ttl_minutes", mode="before")
    @classmethod
    def coerce_auth_session_ttl_minutes(cls, v: Any) -> int | None:
        if v is None:
            return None
        if isinstance(v, str) and not str(v).strip():
            return None
        return int(v)

    @field_validator("database_url")
    @classmethod
    def database_must_be_postgres(cls, v: str) -> str:
        # Windows .env edits often use `host:5432\dbname` — SQLAlchemy treats `\` as part of the port.
        v = re.sub(r"(:\d{1,5})\\+", r"\1/", v.strip())
        if not v.startswith("postgresql"):
            msg = "DATABASE_URL must be a PostgreSQL SQLAlchemy URL (e.g. postgresql+psycopg://...)"
            raise ValueError(msg)
        return v

    @field_validator("auth_cookie_domain", mode="before")
    @classmethod
    def empty_auth_cookie_domain_is_none(cls, v: Any) -> str | None:
        if v is None:
            return None
        if isinstance(v, str) and not v.strip():
            return None
        return str(v).strip()

    @model_validator(mode="after")
    def auth_cookie_security_rules(self) -> Settings:
        if self.auth_cookie_samesite == "none" and not self.auth_cookie_secure:
            msg = (
                "AUTH_COOKIE_SAMESITE=none requires AUTH_COOKIE_SECURE=true "
                "(browsers reject SameSite=None without the Secure attribute)."
            )
            raise ValueError(msg)
        if self.app_environment == "production" and not self.auth_cookie_secure:
            msg = "APP_ENV=production requires secure session cookies (set AUTH_COOKIE_SECURE=true)."
            raise ValueError(msg)
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [part.strip() for part in self.cors_origins.split(",") if part.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return cached settings (singleton per process)."""
    return Settings()
