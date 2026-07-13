from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AuthUser(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    email: str
    display_name: str | None = None
    avatar_url: str | None = None
    created_at: datetime


class SignupRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3, max_length=320)
    verification_token: str = Field(min_length=16, max_length=128)
    password: str = Field(min_length=8, max_length=12)
    display_name: str = Field(min_length=2, max_length=120)


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=200)


class AuthEnvelope(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user: AuthUser


class SendEmailVerificationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3, max_length=320)


class VerifyEmailCodeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3, max_length=320)
    code: str = Field(min_length=6, max_length=6)


class SendEmailVerificationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sent: bool
    delivery: str
    debug_code: str | None = None
    # Staging ops snapshot (non-secret) — verify Railway env without log tailing.
    ops_email_provider: str | None = None
    ops_resend_from_email: str | None = None
    ops_resend_api_key_hint: str | None = None


class VerifyEmailCodeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    verified: bool
    verification_token: str


class PasswordResetRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3, max_length=320)


class PasswordResetResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    accepted: bool
    delivery: str


class PasswordResetConfirmRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str = Field(min_length=32, max_length=256)
    new_password: str = Field(min_length=8, max_length=12)


class UpdateDisplayNameRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str = Field(min_length=2, max_length=120)


class UpdatePasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: str = Field(min_length=8, max_length=200)
    new_password: str = Field(min_length=8, max_length=12)


class AccountSecuritySummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    active_session_count: int = 0
    last_login_at: datetime | None = None

