"""Phase B — minimal Observe aggregates from ``eval_events`` (no product UI unlock).

Counts Home Landing / Results funnel signals and guest vs authenticated split for
``home.viewed``. Used by CLI and tests; does not change Home IA.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from keyboard_recommender.recommendation_quality.evaluation.storage.event_models import EvalEvent

# Primary Observe event types for remaining-work Phase B / C.
OBSERVE_EVENT_TYPES: tuple[str, ...] = (
    "home.viewed",
    "interaction.bookmark",
    "interaction.results_tab_click",
    "interaction.revisit",
    "interaction.repeated_view",
)


@dataclass(frozen=True)
class ObserveUnlockCriteria:
    """Owner-locked sample gates before Home product revisit discussion."""

    min_calendar_days: int = 14
    min_home_viewed_events: int = 50
    require_guest_and_auth_split: bool = True


# Default Owner numbers (2026-07-10) — see docs/remaining-work-phases.md Phase B-2.
DEFAULT_UNLOCK_CRITERIA = ObserveUnlockCriteria()


@dataclass
class ObserveAggregateReport:
    schema_version: str = "observe.aggregate.v1"
    window_days: int | None = None
    generated_at: str = ""
    counts: dict[str, int] = field(default_factory=dict)
    home_viewed_total: int = 0
    home_auth_split: dict[str, int] = field(default_factory=dict)
    distinct_home_sessions: int = 0
    earliest_event_at: str | None = None
    latest_event_at: str | None = None
    span_calendar_days: int | None = None
    unlock_criteria: dict[str, Any] = field(default_factory=dict)
    unlock_ready: bool = False
    unlock_blockers: list[str] = field(default_factory=list)
    product_ui_locked: bool = True
    note: str = (
        "Sample gates only. Redirect / Login Home / Dashboard remain LOCKED until "
        "unlock_ready and Owner Why review."
    )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _payload_meta(payload: Mapping[str, Any] | None) -> dict[str, Any]:
    if not isinstance(payload, Mapping):
        return {}
    meta = payload.get("metadata")
    return dict(meta) if isinstance(meta, Mapping) else {}


def _auth_bucket(meta: Mapping[str, Any]) -> str:
    raw = meta.get("auth")
    if raw in ("guest", "authenticated"):
        return str(raw)
    if meta.get("userId"):
        return "authenticated"
    return "unknown"


def _as_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def aggregate_observe_rows(
    rows: Sequence[Mapping[str, Any]],
    *,
    window_days: int | None = None,
    criteria: ObserveUnlockCriteria = DEFAULT_UNLOCK_CRITERIA,
    now: datetime | None = None,
) -> ObserveAggregateReport:
    """
    Aggregate loose row dicts: ``event_type``, ``created_at``, ``payload`` / ``session_id``.

    ``created_at`` may be datetime or ISO string. Missing timestamps are counted but
    excluded from span / window filtering when unparsable.
    """
    now_utc = _as_utc(now) or datetime.now(timezone.utc)
    window_start = now_utc - timedelta(days=int(window_days)) if window_days is not None else None

    counts = {name: 0 for name in OBSERVE_EVENT_TYPES}
    auth_split = {"guest": 0, "authenticated": 0, "unknown": 0}
    home_sessions: set[str] = set()
    timestamps: list[datetime] = []

    for row in rows:
        et = str(row.get("event_type") or "")
        if et not in counts:
            continue
        created = row.get("created_at")
        if isinstance(created, str):
            try:
                created = datetime.fromisoformat(created.replace("Z", "+00:00"))
            except ValueError:
                created = None
        created_utc = _as_utc(created) if isinstance(created, datetime) else None
        if window_start is not None and created_utc is not None and created_utc < window_start:
            continue

        counts[et] += 1
        if created_utc is not None:
            timestamps.append(created_utc)

        payload = row.get("payload") if isinstance(row.get("payload"), Mapping) else row
        meta = _payload_meta(payload if isinstance(payload, Mapping) else None)
        # Top-level session_id on unified envelope may live on payload.
        session_id = row.get("session_id")
        if not session_id and isinstance(payload, Mapping):
            session_id = payload.get("session_id")

        if et == "home.viewed":
            auth_split[_auth_bucket(meta)] += 1
            if isinstance(session_id, str) and session_id.strip():
                home_sessions.add(session_id.strip())

    earliest = min(timestamps) if timestamps else None
    latest = max(timestamps) if timestamps else None
    span_days: int | None = None
    if earliest is not None and latest is not None:
        span_days = max(1, (latest.date() - earliest.date()).days + 1)

    home_total = counts["home.viewed"]
    blockers: list[str] = []
    if span_days is None or span_days < criteria.min_calendar_days:
        blockers.append(
            f"span_calendar_days<{criteria.min_calendar_days}"
            f" (have={span_days if span_days is not None else 0})",
        )
    if home_total < criteria.min_home_viewed_events:
        blockers.append(
            f"home.viewed<{criteria.min_home_viewed_events} (have={home_total})",
        )
    if criteria.require_guest_and_auth_split:
        if auth_split["guest"] < 1 or auth_split["authenticated"] < 1:
            blockers.append(
                "guest_and_auth_split_incomplete "
                f"(guest={auth_split['guest']}, authenticated={auth_split['authenticated']})",
            )

    unlock_ready = len(blockers) == 0
    return ObserveAggregateReport(
        window_days=window_days,
        generated_at=now_utc.isoformat(),
        counts=counts,
        home_viewed_total=home_total,
        home_auth_split=auth_split,
        distinct_home_sessions=len(home_sessions),
        earliest_event_at=earliest.isoformat() if earliest else None,
        latest_event_at=latest.isoformat() if latest else None,
        span_calendar_days=span_days,
        unlock_criteria=asdict(criteria),
        unlock_ready=unlock_ready,
        unlock_blockers=blockers,
        product_ui_locked=True,
    )


def load_observe_rows_from_db(
    session: Session,
    *,
    window_days: int | None = None,
    limit: int = 50_000,
) -> list[dict[str, Any]]:
    """Load Observe-relevant ``eval_events`` rows (newest first, capped)."""
    stmt = select(EvalEvent).where(EvalEvent.event_type.in_(OBSERVE_EVENT_TYPES))
    if window_days is not None:
        start = datetime.now(timezone.utc) - timedelta(days=int(window_days))
        stmt = stmt.where(EvalEvent.created_at >= start)
    stmt = stmt.order_by(EvalEvent.created_at.desc()).limit(int(limit))
    rows = session.execute(stmt).scalars().all()
    out: list[dict[str, Any]] = []
    for row in rows:
        payload = row.payload if isinstance(row.payload, dict) else {}
        out.append(
            {
                "event_type": row.event_type,
                "created_at": row.created_at,
                "payload": payload,
                "session_id": payload.get("session_id") if isinstance(payload, dict) else None,
            },
        )
    return out


def aggregate_observe_from_db(
    session: Session,
    *,
    window_days: int | None = None,
    criteria: ObserveUnlockCriteria = DEFAULT_UNLOCK_CRITERIA,
    limit: int = 50_000,
) -> ObserveAggregateReport:
    rows = load_observe_rows_from_db(session, window_days=window_days, limit=limit)
    return aggregate_observe_rows(rows, window_days=window_days, criteria=criteria)


__all__ = [
    "DEFAULT_UNLOCK_CRITERIA",
    "OBSERVE_EVENT_TYPES",
    "ObserveAggregateReport",
    "ObserveUnlockCriteria",
    "aggregate_observe_from_db",
    "aggregate_observe_rows",
    "load_observe_rows_from_db",
]
