from __future__ import annotations

import secrets


def new_session_token_id() -> str:
    return secrets.token_urlsafe(32)

