from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from keyboard_recommender.api.deps import get_settings_dep
from keyboard_recommender.app_factory import create_app
from keyboard_recommender.config.settings import Settings


def _client(contact_to: str | None = "ops@swagkey-ops.kr") -> TestClient:
    settings = Settings(
        contact_to_email=contact_to,
        email_provider="smtp",
    )
    app = create_app()
    app.dependency_overrides[get_settings_dep] = lambda: settings
    return TestClient(app)


def test_contact_submit_success():
    with patch(
        "keyboard_recommender.api.v1.contact.send_contact_inquiry_email",
        return_value="log",
    ) as send:
        client = _client()
        res = client.post(
            "/api/v1/contact",
            json={
                "name": "테스터",
                "email": "user@example.org",
                "message": "결과가 저장되지 않아요.",
            },
        )
    assert res.status_code == 200
    body = res.json()
    assert body["sent"] is True
    assert body["delivery"] == "log"
    send.assert_called_once()


def test_contact_rejects_invalid_email():
    client = _client()
    res = client.post(
        "/api/v1/contact",
        json={"name": "A", "email": "not-an-email", "message": "hello"},
    )
    assert res.status_code == 422


def test_contact_unavailable_without_inbox():
    client = _client(contact_to=None)
    res = client.post(
        "/api/v1/contact",
        json={"name": "A", "email": "user@example.org", "message": "hello"},
    )
    assert res.status_code == 503


def test_contact_honeypot_skips_send():
    with patch(
        "keyboard_recommender.api.v1.contact.send_contact_inquiry_email",
        return_value="log",
    ) as send:
        client = _client()
        res = client.post(
            "/api/v1/contact",
            json={
                "name": "Bot",
                "email": "bot@example.org",
                "message": "spam",
                "company": "Acme",
            },
        )
    assert res.status_code == 200
    assert res.json()["sent"] is True
    send.assert_not_called()
