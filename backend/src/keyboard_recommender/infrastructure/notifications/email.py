from __future__ import annotations

import json
import logging
import smtplib
from email.message import EmailMessage
from urllib import error as urllib_error
from urllib import request as urllib_request

from keyboard_recommender.config.settings import Settings

logger = logging.getLogger(__name__)


def _deliver_via_smtp(settings: Settings, *, to_email: str, subject: str, text_body: str) -> str:
    if not settings.smtp_host or not settings.smtp_from_email:
        return "log"
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email
    msg["To"] = to_email
    msg.set_content(text_body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_username and settings.smtp_password:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(msg)
    return "smtp"


def _deliver_via_resend(settings: Settings, *, to_email: str, subject: str, text_body: str) -> str:
    if not settings.resend_api_key or not settings.resend_from_email:
        return "log"
    payload = json.dumps(
        {
            "from": settings.resend_from_email,
            "to": [to_email],
            "subject": subject,
            "text": text_body,
        },
    ).encode("utf-8")
    req = urllib_request.Request(
        url="https://api.resend.com/emails",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib_request.urlopen(req, timeout=15) as resp:
            if resp.status < 200 or resp.status >= 300:
                logger.warning("resend_send_failed status=%s", resp.status)
                return "log"
    except urllib_error.HTTPError as exc:
        logger.warning("resend_send_failed http_status=%s", exc.code)
        return "log"
    except urllib_error.URLError:
        logger.warning("resend_send_failed network_error")
        return "log"
    return "resend"


def _deliver_email(settings: Settings, *, to_email: str, subject: str, text_body: str, fallback_log_key: str) -> str:
    if settings.email_provider == "resend":
        delivery = _deliver_via_resend(settings, to_email=to_email, subject=subject, text_body=text_body)
    else:
        delivery = _deliver_via_smtp(settings, to_email=to_email, subject=subject, text_body=text_body)
    if delivery == "log":
        logger.info("%s email=%s", fallback_log_key, to_email)
    return delivery


def send_verification_code_email(settings: Settings, *, to_email: str, code: str) -> str:
    """
    Best-effort email delivery.

    Returns delivery channel:
    - "smtp"/"resend" when provider credentials are configured and send succeeds
    - "log" when provider isn't configured
    """
    text = f"인증번호는 {code} 입니다.\n{settings.auth_email_code_ttl_minutes}분 이내에 입력해 주세요."
    delivery = _deliver_email(
        settings,
        to_email=to_email,
        subject="Keyboard Recommender 인증번호",
        text_body=text,
        fallback_log_key="verification_code_fallback_log",
    )
    if delivery == "log":
        logger.info("verification_code_fallback_log_code email=%s code=%s", to_email, code)
    return delivery


def send_password_reset_notice_email(settings: Settings, *, to_email: str) -> str:
    """
    Send password-reset guidance email.

    Returns delivery channel:
    - "smtp" when SMTP credentials are configured and send succeeds
    - "log" when SMTP isn't configured (fallback notice for local/dev)
    """
    text = (
        "비밀번호 재설정 요청이 접수되었습니다.\n"
        "현재는 보안 강화를 위해 안내 메일만 제공되며, 곧 재설정 링크 방식이 추가될 예정입니다.\n"
        "본인이 요청하지 않았다면 이 메일을 무시해 주세요."
    )
    return _deliver_email(
        settings,
        to_email=to_email,
        subject="Keyboard Recommender 비밀번호 재설정 안내",
        text_body=text,
        fallback_log_key="password_reset_notice_fallback_log",
    )


def send_password_reset_link_email(settings: Settings, *, to_email: str, reset_url: str) -> str:
    """
    Send actual password-reset link email.

    Returns delivery channel:
    - "smtp" when SMTP credentials are configured and send succeeds
    - "log" when SMTP isn't configured (fallback logs reset URL for local/dev)
    """
    text = (
        "비밀번호 재설정 요청이 접수되었습니다.\n"
        f"아래 링크로 접속해 비밀번호를 재설정해 주세요.\n{reset_url}\n\n"
        f"링크는 {settings.auth_password_reset_ttl_minutes}분 동안만 유효합니다.\n"
        "본인이 요청하지 않았다면 이 메일을 무시해 주세요."
    )
    delivery = _deliver_email(
        settings,
        to_email=to_email,
        subject="Keyboard Recommender 비밀번호 재설정 링크",
        text_body=text,
        fallback_log_key="password_reset_link_fallback_log",
    )
    if delivery == "log":
        logger.info("password_reset_link_fallback_log_url email=%s url=%s", to_email, reset_url)
    return delivery

