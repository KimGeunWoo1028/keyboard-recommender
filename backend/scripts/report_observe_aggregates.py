"""Phase B Observe aggregate CLI — query eval_events without unlocking Home product UI.

Examples (from backend/, venv active):

  python scripts/report_observe_aggregates.py --dry-run-local
  python scripts/report_observe_aggregates.py --window-days 14
  python scripts/report_observe_aggregates.py --json

Requires ENABLE_EVALUATION_PERSISTENCE + DB for live mode. Dry-run uses in-memory fixtures.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

_BACKEND = Path(__file__).resolve().parents[1]
_SRC = _BACKEND / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.observe_aggregate import (  # noqa: E402
    DEFAULT_UNLOCK_CRITERIA,
    ObserveUnlockCriteria,
    aggregate_observe_from_db,
    aggregate_observe_rows,
)


def _fixture_rows(now: datetime) -> list[dict]:
    return [
        {
            "event_type": "home.viewed",
            "created_at": now - timedelta(days=1),
            "session_id": "s-guest-1",
            "payload": {"session_id": "s-guest-1", "metadata": {"auth": "guest", "path": "/"}},
        },
        {
            "event_type": "home.viewed",
            "created_at": now - timedelta(hours=2),
            "session_id": "s-auth-1",
            "payload": {"session_id": "s-auth-1", "metadata": {"auth": "authenticated", "path": "/"}},
        },
        {
            "event_type": "interaction.bookmark",
            "created_at": now - timedelta(hours=1),
            "payload": {"metadata": {"buildId": "b1"}},
        },
        {
            "event_type": "interaction.results_tab_click",
            "created_at": now - timedelta(minutes=30),
            "payload": {"metadata": {"tab": "evidence"}},
        },
        {
            "event_type": "interaction.revisit",
            "created_at": now - timedelta(minutes=10),
            "payload": {"metadata": {}},
        },
        {
            "event_type": "interaction.repeated_view",
            "created_at": now - timedelta(minutes=5),
            "payload": {"metadata": {}},
        },
    ]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Phase B Observe aggregates from eval_events")
    parser.add_argument("--dry-run-local", action="store_true", help="In-memory fixture report (CI-safe)")
    parser.add_argument("--window-days", type=int, default=None, help="Only events in the last N days")
    parser.add_argument("--json", action="store_true", help="Print JSON only")
    parser.add_argument(
        "--min-home-viewed",
        type=int,
        default=DEFAULT_UNLOCK_CRITERIA.min_home_viewed_events,
        help="Override unlock min home.viewed count",
    )
    parser.add_argument(
        "--min-days",
        type=int,
        default=DEFAULT_UNLOCK_CRITERIA.min_calendar_days,
        help="Override unlock min calendar day span",
    )
    args = parser.parse_args(argv)

    criteria = ObserveUnlockCriteria(
        min_calendar_days=int(args.min_days),
        min_home_viewed_events=int(args.min_home_viewed),
        require_guest_and_auth_split=True,
    )

    if args.dry_run_local:
        now = datetime.now(timezone.utc)
        report = aggregate_observe_rows(
            _fixture_rows(now),
            window_days=args.window_days,
            criteria=criteria,
            now=now,
        )
        data = report.to_dict()
        data["mode"] = "dry-run-local"
        data["note"] = (
            "Fixture sample only — unlock_ready expected false under default criteria. "
            "Live DB: omit --dry-run-local. Product UI remains LOCKED."
        )
    else:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        from keyboard_recommender.config.settings import get_settings

        settings = get_settings()
        if not settings.enable_evaluation_persistence:
            print(
                "WARN: ENABLE_EVALUATION_PERSISTENCE is false — events are not stored; "
                "counts will be empty until persistence is enabled.",
                file=sys.stderr,
            )
        engine = create_engine(settings.database_url, future=True)
        SessionLocal = sessionmaker(bind=engine, future=True)
        with SessionLocal() as session:
            report = aggregate_observe_from_db(
                session,
                window_days=args.window_days,
                criteria=criteria,
            )
        data = report.to_dict()
        data["mode"] = "live-db"
        data["evaluation_persistence_enabled"] = bool(settings.enable_evaluation_persistence)

    if args.json:
        print(json.dumps(data, ensure_ascii=False, indent=2, default=str))
        return 0

    print("=== Phase B Observe aggregate ===")
    print(f"mode: {data.get('mode')}")
    print(f"generated_at: {data.get('generated_at')}")
    print(f"window_days: {data.get('window_days')}")
    print(f"counts: {data.get('counts')}")
    print(f"home_viewed_total: {data.get('home_viewed_total')}")
    print(f"home_auth_split: {data.get('home_auth_split')}")
    print(f"distinct_home_sessions: {data.get('distinct_home_sessions')}")
    print(f"span_calendar_days: {data.get('span_calendar_days')}")
    print(f"unlock_criteria: {data.get('unlock_criteria')}")
    print(f"unlock_ready: {data.get('unlock_ready')}")
    print(f"unlock_blockers: {data.get('unlock_blockers')}")
    print(f"product_ui_locked: {data.get('product_ui_locked', True)}")
    print()
    print("Do not: Redirect / Login Home / Dashboard until unlock_ready AND Owner Why review.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
