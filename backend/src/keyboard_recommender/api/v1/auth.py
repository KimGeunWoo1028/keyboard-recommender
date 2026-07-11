from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import re
import secrets
import uuid
from typing import Any
from urllib.parse import quote

from fastapi import APIRouter, Body, File, HTTPException, Query, Request, Response, UploadFile, status
from sqlalchemy import func, select

from keyboard_recommender.api.deps import CurrentUserOptionalDep, DbSession, SettingsDep
from keyboard_recommender.config.settings import Settings
from keyboard_recommender.infrastructure.avatars import (
    delete_user_avatar_files,
    detect_image_extension,
    save_user_avatar,
)
from keyboard_recommender.infrastructure.notifications.email import send_password_reset_link_email, send_verification_code_email
from keyboard_recommender.infrastructure.persistence.models.user_auth import AuthEmailVerification, AuthPasswordReset, AuthSession, User
from keyboard_recommender.schemas.auth import (
    AccountSecuritySummary,
    AuthEnvelope,
    AuthUser,
    LoginRequest,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    PasswordResetResponse,
    SendEmailVerificationRequest,
    SendEmailVerificationResponse,
    SignupRequest,
    UpdateDisplayNameRequest,
    UpdatePasswordRequest,
    VerifyEmailCodeRequest,
    VerifyEmailCodeResponse,
)
from keyboard_recommender.security.passwords import hash_password, verify_password
from keyboard_recommender.security.sessions import new_session_token_id

router = APIRouter(prefix="/auth", tags=["auth"])


def _session_expires_at(settings: Settings, now: datetime) -> datetime:
    if settings.auth_session_ttl_minutes is not None:
        return now + timedelta(minutes=settings.auth_session_ttl_minutes)
    return now + timedelta(hours=settings.auth_session_ttl_hours)
_PASSWORD_ALLOWED = re.compile(r"^[\x21-\x7E]{8,12}$")
_HAS_HANGUL = re.compile(r"[가-힣]")
_HAS_LATIN = re.compile(r"[A-Za-z]")


def _allow_debug_email_code(settings: SettingsDep) -> bool:
    return settings.debug and settings.app_environment in {"local", "development"}


def _normalize_email(raw: str) -> str:
    return raw.strip().lower()


def _assert_email_shape(email: str) -> None:
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid email format.")


def _normalize_display_name(raw: str) -> str:
    return raw.strip()


def _assert_display_name_policy(display_name: str) -> None:
    normalized = _normalize_display_name(display_name)
    if not normalized:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Display name is required.")
    has_hangul = bool(_HAS_HANGUL.search(normalized))
    has_latin = bool(_HAS_LATIN.search(normalized))
    if has_hangul and not has_latin:
        if len(normalized) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Korean display names must be at least 2 characters.",
            )
        return
    if has_latin and not has_hangul:
        if len(normalized) < 3:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="English display names must be at least 3 characters.",
            )
        return
    if len(normalized) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Display name must be at least 3 characters.",
        )


def _assert_password_policy(password: str) -> None:
    """
    Password policy:
    - length 8..12
    - ASCII printable non-space chars only
    - contains at least one letter, one digit, one special character
    """
    if not _PASSWORD_ALLOWED.fullmatch(password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be 8-12 chars and use only English letters, numbers, and special characters.",
        )
    if not re.search(r"[A-Za-z]", password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must include at least one English letter.",
        )
    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must include at least one number.",
        )
    if not re.search(r"[^A-Za-z0-9]", password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must include at least one special character.",
        )


def _to_auth_user(user: User) -> AuthUser:
    return AuthUser(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
    )


def _new_six_digit_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _token_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _auth_cookie_issue_kwargs(settings: Settings) -> dict[str, Any]:
    """Attributes that must match on Set-Cookie and Delete-Cookie for the browser to clear the session."""
    return {
        "path": "/",
        "domain": settings.auth_cookie_domain,
        "secure": settings.auth_cookie_secure,
        "httponly": True,
        "samesite": settings.auth_cookie_samesite,
    }


def _set_auth_cookie(response: Response, settings: SettingsDep, token_id: str, expires_at: datetime) -> None:
    opts = _auth_cookie_issue_kwargs(settings)
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token_id,
        expires=expires_at,
        **opts,
    )


def _clear_auth_cookie(response: Response, settings: Settings) -> None:
    opts = _auth_cookie_issue_kwargs(settings)
    response.delete_cookie(
        key=settings.auth_cookie_name,
        path=opts["path"],
        domain=opts.get("domain"),
        secure=opts["secure"],
        httponly=opts["httponly"],
        samesite=opts["samesite"],
    )


@router.post("/signup", response_model=AuthEnvelope, status_code=status.HTTP_201_CREATED)
def signup(
    body: SignupRequest = Body(...),
    settings: SettingsDep = None,  # type: ignore[assignment]
    db: DbSession = None,  # type: ignore[assignment]
) -> AuthEnvelope:
    assert settings is not None and db is not None
    email = _normalize_email(body.email)
    _assert_email_shape(email)
    existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists.")
    verification = db.execute(
        select(AuthEmailVerification).where(AuthEmailVerification.email == email),
    ).scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if (
        verification is None
        or verification.verification_token != body.verification_token
        or verification.verified_at is None
        or verification.expires_at <= now
        or verification.consumed_at is not None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email verification is required before creating account.",
        )
    _assert_password_policy(body.password)
    normalized_display_name = _normalize_display_name(body.display_name)
    _assert_display_name_policy(normalized_display_name)
    existing_name = db.execute(
        select(User).where(func.lower(User.display_name) == normalized_display_name.lower()),
    ).scalar_one_or_none()
    if existing_name is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Display name already exists.")

    user = User(
        id=uuid.uuid4(),
        email=email,
        password_hash=hash_password(body.password),
        display_name=normalized_display_name,
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    verification.consumed_at = now
    verification.updated_at = now
    db.commit()
    return AuthEnvelope(user=_to_auth_user(user))


@router.post("/email-verification/send", response_model=SendEmailVerificationResponse)
def send_email_verification(
    body: SendEmailVerificationRequest = Body(...),
    settings: SettingsDep = None,  # type: ignore[assignment]
    db: DbSession = None,  # type: ignore[assignment]
) -> SendEmailVerificationResponse:
    assert settings is not None and db is not None
    email = _normalize_email(body.email)
    _assert_email_shape(email)
    code = _new_six_digit_code()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.auth_email_code_ttl_minutes)
    row = db.execute(select(AuthEmailVerification).where(AuthEmailVerification.email == email)).scalar_one_or_none()
    if row is None:
        row = AuthEmailVerification(
            id=uuid.uuid4(),
            email=email,
            code_hash=hash_password(code),
            verification_token=None,
            expires_at=expires_at,
            verified_at=None,
            consumed_at=None,
            created_at=now,
            updated_at=now,
        )
        db.add(row)
    else:
        row.code_hash = hash_password(code)
        row.verification_token = None
        row.expires_at = expires_at
        row.verified_at = None
        row.consumed_at = None
        row.updated_at = now
    db.commit()
    delivery = send_verification_code_email(settings, to_email=email, code=code)
    return SendEmailVerificationResponse(
        sent=True,
        delivery=delivery,
        debug_code=code if _allow_debug_email_code(settings) else None,
    )


@router.post("/email-verification/verify", response_model=VerifyEmailCodeResponse)
def verify_email_code(
    body: VerifyEmailCodeRequest = Body(...),
    db: DbSession = None,  # type: ignore[assignment]
) -> VerifyEmailCodeResponse:
    assert db is not None
    email = _normalize_email(body.email)
    row = db.execute(select(AuthEmailVerification).where(AuthEmailVerification.email == email)).scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if row is None or row.expires_at <= now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code expired or missing.")
    if not verify_password(body.code, row.code_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code.")
    token = secrets.token_urlsafe(32)
    row.verification_token = token
    row.verified_at = now
    row.updated_at = now
    db.commit()
    return VerifyEmailCodeResponse(verified=True, verification_token=token)


@router.post("/password-reset/request", response_model=PasswordResetResponse)
def request_password_reset(
    body: PasswordResetRequest = Body(...),
    settings: SettingsDep = None,  # type: ignore[assignment]
    db: DbSession = None,  # type: ignore[assignment]
) -> PasswordResetResponse:
    assert settings is not None and db is not None
    email = _normalize_email(body.email)
    _assert_email_shape(email)
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if user is None:
        # Do not reveal whether account exists.
        return PasswordResetResponse(accepted=True, delivery="masked")
    now = datetime.now(timezone.utc)
    token = secrets.token_urlsafe(32)
    db.add(
        AuthPasswordReset(
            id=uuid.uuid4(),
            user_id=user.id,
            token_digest=_token_digest(token),
            expires_at=now + timedelta(minutes=settings.auth_password_reset_ttl_minutes),
            consumed_at=None,
            created_at=now,
        ),
    )
    db.commit()
    base = settings.public_frontend_base_url.rstrip("/")
    reset_url = f"{base}/auth/reset-password?token={quote(token)}"
    delivery = send_password_reset_link_email(settings, to_email=email, reset_url=reset_url)
    return PasswordResetResponse(accepted=True, delivery=delivery)


@router.post("/password-reset/confirm", status_code=status.HTTP_204_NO_CONTENT)
def confirm_password_reset(
    body: PasswordResetConfirmRequest = Body(...),
    db: DbSession = None,  # type: ignore[assignment]
) -> Response:
    assert db is not None
    _assert_password_policy(body.new_password)
    now = datetime.now(timezone.utc)
    row = db.execute(
        select(AuthPasswordReset).where(AuthPasswordReset.token_digest == _token_digest(body.token)),
    ).scalar_one_or_none()
    if row is None or row.expires_at <= now or row.consumed_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset link is invalid or expired.")
    user = db.execute(select(User).where(User.id == row.user_id)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset link is invalid or expired.")
    user.password_hash = hash_password(body.new_password)
    user.updated_at = now
    row.consumed_at = now
    db.query(AuthSession).filter(AuthSession.user_id == user.id).delete()
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/login", response_model=AuthEnvelope)
def login(
    response: Response,
    body: LoginRequest = Body(...),
    settings: SettingsDep = None,  # type: ignore[assignment]
    db: DbSession = None,  # type: ignore[assignment]
) -> AuthEnvelope:
    assert settings is not None and db is not None
    email = _normalize_email(body.email)
    _assert_email_shape(email)
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    now = datetime.now(timezone.utc)
    token_id = new_session_token_id()
    expires_at = _session_expires_at(settings, now)
    db.add(
        AuthSession(
            id=uuid.uuid4(),
            user_id=user.id,
            token_id=token_id,
            expires_at=expires_at,
            created_at=now,
        ),
    )
    db.commit()
    _set_auth_cookie(response, settings, token_id, expires_at)
    return AuthEnvelope(user=_to_auth_user(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    settings: SettingsDep = None,  # type: ignore[assignment]
    db: DbSession = None,  # type: ignore[assignment]
    current_user: CurrentUserOptionalDep = None,
) -> Response:
    assert settings is not None and db is not None
    token_id = request.cookies.get(settings.auth_cookie_name)
    if token_id:
        db.query(AuthSession).filter(AuthSession.token_id == token_id).delete()
    if current_user is not None:
        # Remove all expired sessions opportunistically + this user's current session(s)
        now = datetime.now(timezone.utc)
        db.query(AuthSession).filter(AuthSession.expires_at < now).delete()
    _clear_auth_cookie(response, settings)
    response.status_code = status.HTTP_204_NO_CONTENT
    db.commit()
    return response


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
def logout_all(
    request: Request,
    response: Response,
    settings: SettingsDep = None,  # type: ignore[assignment]
    db: DbSession = None,  # type: ignore[assignment]
    current_user: CurrentUserOptionalDep = None,
) -> Response:
    assert settings is not None and db is not None
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    db.query(AuthSession).filter(AuthSession.user_id == current_user.id).delete()
    _clear_auth_cookie(response, settings)
    response.status_code = status.HTTP_204_NO_CONTENT
    db.commit()
    return response


@router.get("/me", response_model=AuthEnvelope)
def me(current_user: CurrentUserOptionalDep = None) -> AuthEnvelope:
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    return AuthEnvelope(user=_to_auth_user(current_user))


@router.get("/security-summary", response_model=AccountSecuritySummary)
def security_summary(
    db: DbSession = None,  # type: ignore[assignment]
    current_user: CurrentUserOptionalDep = None,
) -> AccountSecuritySummary:
    assert db is not None
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    now = datetime.now(timezone.utc)
    sessions = db.execute(
        select(AuthSession)
        .where(AuthSession.user_id == current_user.id, AuthSession.expires_at > now)
        .order_by(AuthSession.created_at.desc()),
    ).scalars().all()
    last_login_at = sessions[0].created_at if sessions else None
    return AccountSecuritySummary(
        active_session_count=len(sessions),
        last_login_at=last_login_at,
    )


@router.post("/display-name", response_model=AuthEnvelope)
def update_display_name(
    body: UpdateDisplayNameRequest = Body(...),
    db: DbSession = None,  # type: ignore[assignment]
    current_user: CurrentUserOptionalDep = None,
) -> AuthEnvelope:
    assert db is not None
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    normalized = _normalize_display_name(body.display_name)
    _assert_display_name_policy(normalized)
    existing = db.execute(
        select(User).where(
            func.lower(User.display_name) == normalized.lower(),
            User.id != current_user.id,
        ),
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Display name already exists.")
    current_user.display_name = normalized
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    return AuthEnvelope(user=_to_auth_user(current_user))


@router.post("/avatar", response_model=AuthEnvelope)
async def upload_avatar(
    file: UploadFile = File(...),
    db: DbSession = None,  # type: ignore[assignment]
    settings: SettingsDep = None,  # type: ignore[assignment]
    current_user: CurrentUserOptionalDep = None,
) -> AuthEnvelope:
    assert db is not None
    assert settings is not None
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Empty image file.")
    if len(data) > settings.avatar_max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image must be {settings.avatar_max_bytes // (1024 * 1024)}MB or smaller.",
        )
    ext = detect_image_extension(data, file.content_type)
    if ext is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only JPEG, PNG, or WebP images are supported.",
        )
    avatar_url = save_user_avatar(settings, str(current_user.id), data, ext)
    current_user.avatar_url = avatar_url
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    return AuthEnvelope(user=_to_auth_user(current_user))


@router.delete("/avatar", response_model=AuthEnvelope)
def clear_avatar(
    db: DbSession = None,  # type: ignore[assignment]
    settings: SettingsDep = None,  # type: ignore[assignment]
    current_user: CurrentUserOptionalDep = None,
) -> AuthEnvelope:
    assert db is not None
    assert settings is not None
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    delete_user_avatar_files(settings, str(current_user.id))
    current_user.avatar_url = None
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    return AuthEnvelope(user=_to_auth_user(current_user))


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    body: UpdatePasswordRequest = Body(...),
    db: DbSession = None,  # type: ignore[assignment]
    current_user: CurrentUserOptionalDep = None,
) -> Response:
    assert db is not None
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is invalid.")
    _assert_password_policy(body.new_password)
    current_user.password_hash = hash_password(body.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/display-name-availability")
def display_name_availability(
    display_name: str = Query(min_length=2, max_length=120),
    db: DbSession = None,  # type: ignore[assignment]
) -> dict[str, bool | str]:
    assert db is not None
    normalized = _normalize_display_name(display_name)
    _assert_display_name_policy(normalized)
    existing = db.execute(
        select(User).where(func.lower(User.display_name) == normalized.lower()),
    ).scalar_one_or_none()
    return {"display_name": normalized, "available": existing is None}

