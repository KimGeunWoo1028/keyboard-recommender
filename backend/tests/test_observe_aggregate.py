"""Phase B Observe aggregate + results_tab_click schema acceptance."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.event_collector.normalize import (
    normalize_raw_unified_event,
)
from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.observe_aggregate import (
    DEFAULT_UNLOCK_CRITERIA,
    ObserveUnlockCriteria,
    aggregate_observe_rows,
)


def test_normalize_results_tab_click_is_accepted() -> None:
    ev = normalize_raw_unified_event(
        {
            "request_id": "r-tab-1",
            "event_type": "interaction.results_tab_click",
            "scenario_id": "results_ux_v1",
            "metadata": {"tab": "evidence", "buildId": "b1"},
        },
    )
    assert ev.event_type == "interaction.results_tab_click"
    assert ev.metadata["tab"] == "evidence"


def test_aggregate_observe_guest_auth_split_and_blockers() -> None:
    now = datetime(2026, 7, 10, 12, 0, tzinfo=timezone.utc)
    rows = [
        {
            "event_type": "home.viewed",
            "created_at": now - timedelta(days=2),
            "session_id": "g1",
            "payload": {"session_id": "g1", "metadata": {"auth": "guest"}},
        },
        {
            "event_type": "home.viewed",
            "created_at": now - timedelta(days=1),
            "session_id": "a1",
            "payload": {"session_id": "a1", "metadata": {"auth": "authenticated"}},
        },
        {
            "event_type": "interaction.bookmark",
            "created_at": now,
            "payload": {"metadata": {}},
        },
        {
            "event_type": "interaction.results_tab_click",
            "created_at": now,
            "payload": {"metadata": {"tab": "overview"}},
        },
        {
            "event_type": "interaction.revisit",
            "created_at": now,
            "payload": {"metadata": {}},
        },
        {
            "event_type": "interaction.repeated_view",
            "created_at": now,
            "payload": {"metadata": {}},
        },
    ]
    report = aggregate_observe_rows(rows, criteria=DEFAULT_UNLOCK_CRITERIA, now=now)
    assert report.counts["home.viewed"] == 2
    assert report.counts["interaction.bookmark"] == 1
    assert report.counts["interaction.results_tab_click"] == 1
    assert report.home_auth_split["guest"] == 1
    assert report.home_auth_split["authenticated"] == 1
    assert report.distinct_home_sessions == 2
    assert report.span_calendar_days == 3
    assert report.product_ui_locked is True
    assert report.unlock_ready is False
    assert any("home.viewed<" in b for b in report.unlock_blockers)
    assert any("span_calendar_days<" in b for b in report.unlock_blockers)


def test_aggregate_observe_unlock_ready_when_criteria_met() -> None:
    now = datetime(2026, 7, 10, 12, 0, tzinfo=timezone.utc)
    criteria = ObserveUnlockCriteria(
        min_calendar_days=3,
        min_home_viewed_events=4,
        require_guest_and_auth_split=True,
    )
    rows = []
    for i in range(3):
        rows.append(
            {
                "event_type": "home.viewed",
                "created_at": now - timedelta(days=i),
                "session_id": f"g-{i}",
                "payload": {"session_id": f"g-{i}", "metadata": {"auth": "guest"}},
            },
        )
    rows.append(
        {
            "event_type": "home.viewed",
            "created_at": now,
            "session_id": "a-0",
            "payload": {"session_id": "a-0", "metadata": {"auth": "authenticated"}},
        },
    )
    report = aggregate_observe_rows(rows, criteria=criteria, now=now)
    assert report.unlock_ready is True
    assert report.unlock_blockers == []
    # Still locked for product UI until Owner Why — flag stays true by design.
    assert report.product_ui_locked is True


def test_aggregate_window_days_filters() -> None:
    now = datetime(2026, 7, 10, 12, 0, tzinfo=timezone.utc)
    rows = [
        {
            "event_type": "home.viewed",
            "created_at": now - timedelta(days=20),
            "session_id": "old",
            "payload": {"session_id": "old", "metadata": {"auth": "guest"}},
        },
        {
            "event_type": "home.viewed",
            "created_at": now - timedelta(days=1),
            "session_id": "new",
            "payload": {"session_id": "new", "metadata": {"auth": "guest"}},
        },
    ]
    report = aggregate_observe_rows(rows, window_days=7, criteria=DEFAULT_UNLOCK_CRITERIA, now=now)
    assert report.counts["home.viewed"] == 1
    assert report.distinct_home_sessions == 1
