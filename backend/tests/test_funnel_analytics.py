"""Phase C funnel analytics + debug KPI Compare exclusion."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.funnel_analytics import (
    EXCLUDED_SUCCESS_METRICS,
    aggregate_funnel_rows,
    funnel_report_to_csv,
)
from keyboard_recommender.schemas.analytics import KpiSnapshot


def test_funnel_bookmark_conversion_and_excludes_compare() -> None:
    now = datetime(2026, 7, 10, 12, 0, tzinfo=timezone.utc)
    rows = [
        {
            "event_type": "onboarding.viewed",
            "created_at": now - timedelta(hours=5),
            "payload": {"metadata": {}},
        },
        {
            "event_type": "onboarding.viewed",
            "created_at": now - timedelta(hours=4),
            "payload": {"metadata": {}},
        },
        {
            "event_type": "onboarding.completed",
            "created_at": now - timedelta(hours=3),
            "payload": {"metadata": {}},
        },
        {
            "event_type": "interaction.bookmark",
            "created_at": now - timedelta(hours=2),
            "payload": {"metadata": {}},
        },
        {
            "event_type": "interaction.results_tab_click",
            "created_at": now - timedelta(hours=1),
            "payload": {"metadata": {"tab": "evidence"}},
        },
        {
            "event_type": "interaction.results_tab_click",
            "created_at": now - timedelta(minutes=30),
            "payload": {"metadata": {"tab": "overview"}},
        },
        {
            "event_type": "kpi.time_to_first_result",
            "created_at": now - timedelta(hours=3),
            "payload": {"metadata": {"duration_ms": 2500}},
        },
        # Must not appear in FUNNEL counts / success rates
        {
            "event_type": "interaction.comparison",
            "created_at": now,
            "payload": {"metadata": {}},
        },
        {
            "event_type": "interaction.drawer_open",
            "created_at": now,
            "payload": {"metadata": {}},
        },
    ]
    report = aggregate_funnel_rows(rows, window_days=7, now=now)
    assert report.counts["onboarding.completed"] == 1
    assert report.counts["interaction.bookmark"] == 1
    assert "interaction.comparison" not in report.counts
    assert report.rates["bookmark_given_onboarding_completed"] == 1.0
    assert report.rates["onboarding_completion"] == 0.5
    assert report.evidence_tab_clicks == 1
    assert report.overview_tab_clicks == 1
    assert report.rates["evidence_tab_given_tab_clicks"] == 0.5
    assert report.avg_time_to_first_result_ms == 2500.0
    assert report.excluded_from_success == list(EXCLUDED_SUCCESS_METRICS)
    assert report.product_ui_locked is True
    assert report.phase_b_unlock_ready is False


def test_funnel_csv_export_contains_bookmark_rate() -> None:
    now = datetime(2026, 7, 10, 12, 0, tzinfo=timezone.utc)
    rows = [
        {
            "event_type": "onboarding.completed",
            "created_at": now,
            "payload": {"metadata": {}},
        },
        {
            "event_type": "interaction.bookmark",
            "created_at": now,
            "payload": {"metadata": {}},
        },
    ]
    report = aggregate_funnel_rows(rows, window_days=7, now=now)
    csv_text = funnel_report_to_csv(report)
    assert "rate.bookmark_given_onboarding_completed" in csv_text
    assert "interaction.comparison" in csv_text  # listed as excluded metric value
    assert "excluded_success_metric" in csv_text


def test_kpi_snapshot_defaults_exclude_compare_success() -> None:
    snap = KpiSnapshot(window_hours=24, generated_at=datetime.now(timezone.utc))
    assert snap.comparison_usage_rate == 0.0
    assert "interaction.comparison" in snap.excluded_success_metrics
    assert "interaction.drawer_open" in snap.excluded_success_metrics
