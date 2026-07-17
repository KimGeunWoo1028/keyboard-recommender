from __future__ import annotations

from html import escape
import logging
import smtplib
from email.message import EmailMessage

import httpx

from keyboard_recommender.config.settings import Settings

logger = logging.getLogger(__name__)

_RESEND_USER_AGENT = "keyboard-recommender-api/0.1.0"


def _frontend_url(settings: Settings, path: str = "") -> str:
    base = settings.public_frontend_base_url.rstrip("/")
    if base == "https://keyboard-recommender.com":
        base = "https://www.keyboard-recommender.com"
    suffix = path if path.startswith("/") else f"/{path}" if path else ""
    return f"{base}{suffix}"


def _format_lines_html(lines: list[str]) -> str:
    return "".join(
        f"<p style=\"margin:0 0 16px;color:#f8fafc;font-family:'Inter',Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:16px;line-height:1.8;word-break:keep-all;\">{escape(line)}</p>"
        for line in lines
    )


def _render_email_html(
    settings: Settings,
    *,
    eyebrow: str,
    title: str,
    intro: str,
    body_lines: list[str],
    highlight_label: str | None = None,
    highlight_value: str | None = None,
    highlight_hint: str | None = None,
    cta_label: str | None = None,
    cta_url: str | None = None,
    notice: str | None = None,
) -> str:
    brand_url = _frontend_url(settings)
    brand_logo_url = _frontend_url(settings, "/brand/logo-mark.png")
    support_url = _frontend_url(settings, "/auth")
    brand_block = f"""
      <div style="padding:0 0 28px;text-align:center;">
        <a href="{escape(brand_url, quote=True)}" style="display:inline-block;text-decoration:none;">
          <img src="{escape(brand_logo_url, quote=True)}" alt="Keyboard Recommender" width="44" height="44" style="display:block;margin:0 auto 14px;border:0;outline:none;text-decoration:none;" />
          <div style="color:#f8fafc;font-family:'Hanken Grotesk','Inter',Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:26px;font-weight:800;letter-spacing:-0.02em;line-height:1.2;white-space:nowrap;">
            Keyboard Recommender
          </div>
        </a>
      </div>
    """
    highlight_block = ""
    if highlight_value:
        label_prefix = f"{highlight_label}: " if highlight_label else ""
        highlight_hint_html = (
            f"<p style=\"margin:14px 0 0;color:#cbd5e1;font-family:'Inter',Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:15px;line-height:1.8;word-break:keep-all;\">{escape(highlight_hint)}</p>"
            if highlight_hint
            else ""
        )
        highlight_block = f"""
          <div style="margin:0 0 24px;">
            <div style="color:#f8fafc;font-family:'Hanken Grotesk','Inter',Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:18px;font-weight:700;line-height:1.7;word-break:keep-all;">
              {escape(label_prefix)}<span style="font-size:42px;font-weight:800;letter-spacing:0.12em;">{escape(highlight_value)}</span>
            </div>
            {highlight_hint_html}
          </div>
        """
    cta_block = ""
    if cta_label and cta_url:
        cta_block = f"""
          <div style="margin:28px 0 0;">
            <a href="{escape(cta_url, quote=True)}" style="display:inline-block;padding:16px 28px;border-radius:999px;background:#6d86e7;color:#ffffff;font-family:'Hanken Grotesk','Inter',Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:16px;font-weight:800;letter-spacing:-0.01em;text-decoration:none;">
              {escape(cta_label)}
            </a>
          </div>
        """
    notice_block = ""
    if notice:
        notice_block = f"""
          <p style="margin:26px 0 0;color:#cbd5e1;font-family:'Inter',Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:14px;line-height:1.8;word-break:keep-all;">{escape(notice)}</p>
        """
    return f"""<!DOCTYPE html>
<html lang="ko">
  <body style="margin:0;padding:0;background:#222426;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      {escape(intro)}
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#222426;padding:28px 10px;font-family:Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;background:#2a2d31;border:1px solid #313946;border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:18px 24px;background:#2a2d31;border-bottom:1px solid #313946;color:#f8fafc;font-family:'Inter',Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:13px;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                본인이 요청하지 않았다면 메일 내 링크를 클릭하지 마세요
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;background:#2a2d31;">
                <div style="margin:0 0 22px;color:#9fb6dd;font-family:'Hanken Grotesk','Inter',Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:13px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;">
                  {escape(eyebrow)}
                </div>
                {brand_block}
                {highlight_block}
                <div style="color:#f8fafc;font-family:'Inter',Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:16px;line-height:1.85;word-break:keep-all;">
                  {_format_lines_html([intro])}
                  {_format_lines_html(body_lines)}
                </div>
                {cta_block}
                {notice_block}
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;border-top:1px solid #313946;background:#2a2d31;">
                <div style="margin:0 0 10px;color:#f8fafc;font-family:'Hanken Grotesk','Inter',Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:14px;font-weight:800;">Keyboard Recommender</div>
                <div style="margin:0 0 12px;color:#cbd5e1;font-family:'Inter',Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:13px;line-height:1.8;word-break:keep-all;">
                  맞춤 키보드 추천과 계정 보안을 위한 안내 메일입니다.
                </div>
                <div style="margin:0;color:#cbd5e1;font-family:'Inter',Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:12px;line-height:1.8;word-break:keep-all;">
                  도움이 필요하면
                  <a href="{escape(support_url, quote=True)}" style="color:#9fb6dd;text-decoration:none;">서비스 페이지</a>
                  에서 다시 진행해 주세요.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def _deliver_via_smtp(
    settings: Settings,
    *,
    to_email: str,
    subject: str,
    text_body: str,
    html_body: str | None = None,
) -> str:
    if not settings.smtp_host or not settings.smtp_from_email:
        return "log"
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email
    msg["To"] = to_email
    msg.set_content(text_body)
    if html_body:
        msg.add_alternative(html_body, subtype="html")

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_username and settings.smtp_password:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(msg)
    return "smtp"


def _deliver_via_resend(
    settings: Settings,
    *,
    to_email: str,
    subject: str,
    text_body: str,
    html_body: str | None = None,
) -> str:
    if not settings.resend_api_key or not settings.resend_from_email:
        return "log"
    headers = {
        "Authorization": f"Bearer {settings.resend_api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": _RESEND_USER_AGENT,
    }
    body = {
        "from": settings.resend_from_email,
        "to": [to_email],
        "subject": subject,
        "text": text_body,
    }
    if html_body:
        body["html"] = html_body
    try:
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers=headers,
            json=body,
            timeout=15.0,
        )
        if resp.status_code < 200 or resp.status_code >= 300:
            logger.warning(
                "resend_send_failed http_status=%s from=%s to=%s detail=%s",
                resp.status_code,
                settings.resend_from_email,
                to_email,
                resp.text[:500],
            )
            return "log"
    except httpx.HTTPError:
        logger.warning("resend_send_failed network_error from=%s to=%s", settings.resend_from_email, to_email)
        return "log"
    return "resend"


def _deliver_email(
    settings: Settings,
    *,
    to_email: str,
    subject: str,
    text_body: str,
    html_body: str | None = None,
    fallback_log_key: str,
) -> str:
    if settings.email_provider == "resend":
        delivery = _deliver_via_resend(
            settings,
            to_email=to_email,
            subject=subject,
            text_body=text_body,
            html_body=html_body,
        )
    else:
        delivery = _deliver_via_smtp(
            settings,
            to_email=to_email,
            subject=subject,
            text_body=text_body,
            html_body=html_body,
        )
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
    text = (
        f"인증번호: {code}\n"
        f"{settings.auth_email_code_ttl_minutes}분 이내에 입력해 주세요.\n\n"
        "본인이 요청하지 않았다면 이 메일을 무시해 주세요."
    )
    html = _render_email_html(
        settings,
        eyebrow="Verification",
        title="이메일 인증번호 안내",
        intro="계정 본인 확인을 위해 아래 인증번호를 입력해 주세요.",
        body_lines=[
            "가입 또는 로그인 확인을 진행 중이라면 아래 인증번호를 인증 화면에 그대로 입력해 주세요.",
            f"인증번호는 발송 시점부터 {settings.auth_email_code_ttl_minutes}분 동안만 유효합니다.",
        ],
        highlight_label="Verification code",
        highlight_value=code,
        highlight_hint="인증번호를 입력한 뒤 브라우저 화면으로 돌아가 계속 진행해 주세요.",
        cta_label="인증 화면으로 이동",
        cta_url=_frontend_url(settings, "/auth"),
        notice="본인이 요청하지 않았다면 메일 내 링크를 클릭하지 말고 이 메시지를 무시해 주세요.",
    )
    delivery = _deliver_email(
        settings,
        to_email=to_email,
        subject="Keyboard Recommender 인증번호",
        text_body=text,
        html_body=html,
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
        "보안을 위해 이 안내 메일을 발송했습니다.\n"
        "본인이 요청하지 않았다면 이 메일을 무시해 주세요."
    )
    html = _render_email_html(
        settings,
        eyebrow="Security",
        title="비밀번호 재설정 요청 안내",
        intro="계정 보안을 위해 비밀번호 재설정 요청 사실을 알려드립니다.",
        body_lines=[
            "조금 전 비밀번호 재설정 요청이 접수되었습니다.",
            "본인이 요청한 작업이 아니라면 즉시 기존 비밀번호를 유지하고 이 메일을 무시해 주세요.",
        ],
        notice="의심스러운 활동이 계속되면 같은 이메일로 재설정 링크가 도착하는지 다시 확인해 주세요.",
    )
    return _deliver_email(
        settings,
        to_email=to_email,
        subject="Keyboard Recommender 비밀번호 재설정 안내",
        text_body=text,
        html_body=html,
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
        f"아래 링크에서 새 비밀번호를 설정해 주세요.\n{reset_url}\n\n"
        f"이 링크는 {settings.auth_password_reset_ttl_minutes}분 동안만 유효합니다.\n"
        "본인이 요청하지 않았다면 이 메일을 무시해 주세요."
    )
    html = _render_email_html(
        settings,
        eyebrow="Reset",
        title="비밀번호 재설정 링크",
        intro="아래 버튼을 눌러 새 비밀번호를 설정해 주세요.",
        body_lines=[
            "보안을 위해 링크 만료 시간이 짧게 설정되어 있습니다.",
            f"재설정 링크는 발송 시점부터 {settings.auth_password_reset_ttl_minutes}분 동안만 사용할 수 있습니다.",
            "버튼이 열리지 않으면 아래 링크를 브라우저 주소창에 직접 붙여 넣어 주세요.",
            reset_url,
        ],
        cta_label="비밀번호 재설정",
        cta_url=reset_url,
        notice="본인이 요청하지 않았다면 계정 비밀번호를 변경하지 않아도 됩니다.",
    )
    delivery = _deliver_email(
        settings,
        to_email=to_email,
        subject="Keyboard Recommender 비밀번호 재설정 링크",
        text_body=text,
        html_body=html,
        fallback_log_key="password_reset_link_fallback_log",
    )
    if delivery == "log":
        logger.info("password_reset_link_fallback_log_url email=%s url=%s", to_email, reset_url)
    return delivery


def send_account_deleted_email(settings: Settings, *, to_email: str) -> str:
    """
    Best-effort account-deletion confirmation email.

    Returns delivery channel:
    - "smtp"/"resend" when provider credentials are configured and send succeeds
    - "log" when provider isn't configured or send fails (deletion is never rolled back)
    """
    text = (
        "회원 탈퇴가 완료되었습니다.\n"
        "계정, 프로필, 저장한 빌드 접근 권한이 삭제되었습니다.\n"
        "같은 이메일로 다시 가입할 수 있습니다.\n\n"
        "본인이 요청하지 않았다면 즉시 서비스 관리자에게 문의해 주세요."
    )
    html = _render_email_html(
        settings,
        eyebrow="Account",
        title="회원 탈퇴가 완료되었습니다",
        intro="요청하신 계정 삭제 절차가 정상적으로 처리되었습니다.",
        body_lines=[
            "계정, 프로필, 저장한 빌드 접근 권한이 삭제되었습니다.",
            "같은 이메일로 다시 가입할 수 있지만 이전 데이터는 복구되지 않습니다.",
        ],
        cta_label="서비스 다시 보기",
        cta_url=_frontend_url(settings),
        notice="본인이 요청하지 않았다면 즉시 서비스 관리자에게 알려 주세요.",
    )
    try:
        return _deliver_email(
            settings,
            to_email=to_email,
            subject="Keyboard Recommender 회원 탈퇴 완료",
            text_body=text,
            html_body=html,
            fallback_log_key="account_deleted_fallback_log",
        )
    except Exception:
        logger.exception("account_deleted_email_failed email=%s", to_email)
        logger.info("account_deleted_fallback_log email=%s", to_email)
        return "log"
