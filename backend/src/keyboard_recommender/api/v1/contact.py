"""In-app contact form (CTR-01)."""

from __future__ import annotations

import re
from typing import Annotated

from fastapi import APIRouter, Body, HTTPException, status

from keyboard_recommender.api.deps import SettingsDep
from keyboard_recommender.infrastructure.notifications.email import send_contact_inquiry_email
from keyboard_recommender.schemas.contact import ContactRequest, ContactResponse

router = APIRouter(prefix="/contact", tags=["contact"])

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _resolve_ops_inbox(contact_to_email: str | None) -> str | None:
    raw = (contact_to_email or "").strip()
    if not raw:
        return None
    if re.search(r"test", raw, re.I) or re.search(r"example\.com$", raw, re.I):
        return None
    return raw


@router.post(
    "",
    response_model=ContactResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit a contact inquiry to the ops inbox",
)
def post_contact(
    settings: SettingsDep,
    body: Annotated[ContactRequest, Body()],
) -> ContactResponse:
    # Honeypot: pretend success without delivering.
    if body.company.strip():
        return ContactResponse(sent=True, delivery="log")

    if not _EMAIL_RE.match(body.email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="유효한 이메일 주소를 입력해 주세요.",
        )

    inbox = _resolve_ops_inbox(settings.contact_to_email)
    if not inbox:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="문의 수신 주소가 아직 설정되지 않았습니다. 잠시 후 다시 시도해 주세요.",
        )

    delivery = send_contact_inquiry_email(
        settings,
        to_email=inbox,
        name=body.name,
        reply_email=body.email,
        message=body.message,
    )
    return ContactResponse(sent=True, delivery=delivery)
