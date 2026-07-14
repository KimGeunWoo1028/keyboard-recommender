"""Purge / anonymize data associated with a user account (account deletion)."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from keyboard_recommender.config.settings import Settings
from keyboard_recommender.infrastructure.avatars import delete_user_avatar_files
from keyboard_recommender.infrastructure.persistence.models.user_auth import (
    AuthEmailVerification,
    AuthSession,
    User,
)
from keyboard_recommender.recommendation_quality.evaluation.storage.event_models import EvalEvent


def _anonymize_eval_events_for_user(db: Session, user_id: str) -> int:
    """
    L2=B — null out payload.user_id and metadata.userId; keep rows for Observe/funnel.

    Scans eval_events in-process (user_id lives in JSON payload, not a FK column).
    """
    changed = 0
    rows = db.execute(select(EvalEvent)).scalars().all()
    for row in rows:
        payload = row.payload if isinstance(row.payload, dict) else None
        if payload is None:
            continue
        new_payload = dict(payload)
        dirty = False
        if new_payload.get("user_id") == user_id:
            new_payload["user_id"] = None
            dirty = True
        meta = new_payload.get("metadata")
        if isinstance(meta, dict) and meta.get("userId") == user_id:
            new_payload["metadata"] = {**meta, "userId": None}
            dirty = True
        if not dirty:
            continue
        row.payload = new_payload
        flag_modified(row, "payload")
        changed += 1
    return changed


def purge_user_associated_data(db: Session, settings: Settings, user: User) -> None:
    """
    Avatar files → eval_events anonymize → email verifications → sessions → delete user.

    Commits the DB transaction. Caller clears the auth cookie after this returns.
    """
    user_id = str(user.id)
    email = user.email

    delete_user_avatar_files(settings, user_id)
    _anonymize_eval_events_for_user(db, user_id)
    db.query(AuthEmailVerification).filter(AuthEmailVerification.email == email).delete()
    db.query(AuthSession).filter(AuthSession.user_id == user.id).delete()
    db.delete(user)
    db.commit()
