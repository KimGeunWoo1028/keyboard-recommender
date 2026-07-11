"""Create a fixed E2E user in PostgreSQL (idempotent).

Used by CI Playwright: run after ``alembic upgrade head`` so UI login works.
Credentials default to env ``E2E_USER_EMAIL`` / ``E2E_USER_PASSWORD`` / ``E2E_USER_DISPLAY_NAME``.
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from keyboard_recommender.infrastructure.persistence.models.user_auth import User
from keyboard_recommender.infrastructure.persistence.session import SessionLocal
from keyboard_recommender.security.passwords import hash_password


def main() -> None:
    email = os.environ.get("E2E_USER_EMAIL", "e2e-ci@keyboard.local").strip().lower()
    password = os.environ.get("E2E_USER_PASSWORD", "E2e_test!9")
    display = os.environ.get("E2E_USER_DISPLAY_NAME", "e2e_ci")
    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if existing is not None:
            print(f"seed_e2e_user: already exists {email}")
            return
        db.add(
            User(
                id=uuid.uuid4(),
                email=email,
                password_hash=hash_password(password),
                display_name=display,
                created_at=now,
                updated_at=now,
            ),
        )
        db.commit()
        print(f"seed_e2e_user: created {email}")


if __name__ == "__main__":
    main()
