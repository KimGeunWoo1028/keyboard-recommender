"""Phase C funnel / conversion CLI — weekly Observe without Compare success KPIs.

Examples (from backend/, venv active):

  python scripts/report_funnel_analytics.py --dry-run-local
  python scripts/report_funnel_analytics.py --window-days 7
  python scripts/report_funnel_analytics.py --csv funnel-week.csv
  python scripts/report_funnel_analytics.py --json
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

from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.funnel_analytics import (  # noqa: E402
    aggregate_funnel_from_db,
    aggregate_funnel_rows,
    funnel_report_to_csv,
)
from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.observe_aggregate import (  # noqa: E402
    DEFAULT_UNLOCK_CRITERIA,
)


def _fixture_rows(now: datetime) -> list[dict]:
    return [
        {
            "event_type": "home.viewed",
            "created_at": now - timedelta(days=3),
            "session_id": "g1",
            "payload": {"session_id": "g1", "metadata": {"auth": "guest"}},
        },
        {
            "event_type": "home.viewed",
            "created_at": now - timedelta(days=2),
            "session_id": "a1",
            "payload": {"session_id": "a1", "metadata": {"auth": "authenticated"}},
        },
        {
            "event_type": "onboarding.viewed",
            "created_at": now - timedelta(days=2),
            "payload": {"metadata": {}},
        },
        {
            "event_type": "onboarding.viewed",
            "created_at": now - timedelta(days=1),
            "payload": {"metadata": {}},
        },
        {
            "event_type": "onboarding.completed",
            "created_at": now - timedelta(days=1),
            "payload": {"metadata": {}},
        },
        {
            "event_type": "kpi.time_to_first_result",
            "created_at": now - timedelta(days=1),
            "payload": {"metadata": {"duration_ms": 4200}},
        },
        {
            "event_type": "interaction.bookmark",
            "created_at": now - timedelta(hours=12),
            "payload": {"metadata": {"buildId": "b1"}},
        },
        {
            "event_type": "interaction.results_tab_click",
            "created_at": now - timedelta(hours=11),
            "payload": {"metadata": {"tab": "evidence"}},
        },
        {
            "event_type": "interaction.results_tab_click",
            "created_at": now - timedelta(hours=10),
            "payload": {"metadata": {"tab": "overview"}},
        },
        {
            "event_type": "interaction.click",
            "created_at": now - timedelta(hours=9),
            "payload": {"metadata": {}},
        },
        {
            "event_type": "interaction.revisit",
            "created_at": now - timedelta(hours=1),
            "payload": {"metadata": {}},
        },
    ]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Phase C funnel analytics from eval_events")
    parser.add_argument("--dry-run-local", action="store_true", help="In-memory fixture report (CI-safe)")
    parser.add_argument("--window-days", type=int, default=7, help="Lookback window (default 7)")
    parser.add_argument("--json", action="store_true", help="Print JSON only")
    parser.add_argument("--csv", type=str, default="", help="Write weekly CSV to this path")
    args = parser.parse_args(argv)

    window_days = int(args.window_days) if args.window_days else None

    if args.dry_run_local:
        now = datetime.now(timezone.utc)
        report = aggregate_funnel_rows(
            _fixture_rows(now),
            window_days=window_days,
            unlock_criteria=DEFAULT_UNLOCK_CRITERIA,
            now=now,
        )
        data = report.to_dict()
        data["mode"] = "dry-run-local"
    else:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        from keyboard_recommender.config.settings import get_settings

        settings = get_settings()
        if not settings.enable_evaluation_persistence:
            print(
                "WARN: ENABLE_EVALUATION_PERSISTENCE is false — counts may be empty.",
                file=sys.stderr,
            )
        engine = create_engine(settings.database_url, future=True)
        SessionLocal = sessionmaker(bind=engine, future=True)
        with SessionLocal() as session:
            report = aggregate_funnel_from_db(
                session,
                window_days=window_days,
                unlock_criteria=DEFAULT_UNLOCK_CRITERIA,
            )
        data = report.to_dict()
        data["mode"] = "live-db"
        data["evaluation_persistence_enabled"] = bool(settings.enable_evaluation_persistence)

    if args.csv:
        path = Path(args.csv)
        path.write_text(funnel_report_to_csv(report), encoding="utf-8")
        print(f"Wrote CSV: {path.resolve()}", file=sys.stderr)

    if args.json:
        print(json.dumps(data, ensure_ascii=False, indent=2, default=str))
        return 0

    rates = data.get("rates") or {}
    print("=== Phase C Funnel analytics ===")
    print(f"mode: {data.get('mode')}")
    print(f"window_days: {data.get('window_days')}")
    print(f"counts: {data.get('counts')}")
    print(f"rates: {rates}")
    print(f"avg_time_to_first_result_ms: {data.get('avg_time_to_first_result_ms')}")
    print(f"evidence_tab_clicks: {data.get('evidence_tab_clicks')}")
    print(f"excluded_from_success: {data.get('excluded_from_success')}")
    print(f"phase_b_unlock_ready: {data.get('phase_b_unlock_ready')}")
    print(f"phase_b_unlock_blockers: {data.get('phase_b_unlock_blockers')}")
    print(f"product_ui_locked: {data.get('product_ui_locked')}")
    bookmark_rate = rates.get("bookmark_given_onboarding_completed")
    if bookmark_rate is None:
        print("bookmark_conversion: n/a (no onboarding.completed in window)")
    else:
        print(f"bookmark_conversion: {bookmark_rate:.1%} (bookmark / onboarding.completed)")
    print()
    print("Do not: treat Compare/drawer_open as success. Home product UI locked until Phase B unlock.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
