"""Phase C — funnel / conversion rates from ``eval_events`` (Compare excluded).

Builds on Phase B Observe counts. Does not unlock Home product UI.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from keyboard_recommender.recommendation_quality.evaluation.storage.event_models import EvalEvent
from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.observe_aggregate import (
    DEFAULT_UNLOCK_CRITERIA,
    ObserveUnlockCriteria,
    _as_utc,
    _payload_meta,
    aggregate_observe_rows,
)

# Funnel events for Phase C (includes Phase B Observe set + onboarding/KPI/click).
FUNNEL_EVENT_TYPES: tuple[str, ...] = (
    "home.viewed",
    "onboarding.viewed",
    "onboarding.completed",
    "kpi.time_to_first_result",
    "interaction.bookmark",
    "interaction.results_tab_click",
    "interaction.click",
    "interaction.revisit",
    "interaction.repeated_view",
)

# Explicitly excluded from success metrics (Compare removed from product).
EXCLUDED_SUCCESS_METRICS: tuple[str, ...] = (
    "interaction.comparison",
    "interaction.drawer_open",
)


@dataclass
class FunnelAnalyticsReport:
    schema_version: str = "funnel.analytics.v1"
    window_days: int | None = None
    generated_at: str = ""
    counts: dict[str, int] = field(default_factory=dict)
    rates: dict[str, float | None] = field(default_factory=dict)
    avg_time_to_first_result_ms: float | None = None
    evidence_tab_clicks: int = 0
    overview_tab_clicks: int = 0
    excluded_from_success: list[str] = field(default_factory=lambda: list(EXCLUDED_SUCCESS_METRICS))
    phase_b_unlock_ready: bool = False
    phase_b_unlock_blockers: list[str] = field(default_factory=list)
    product_ui_locked: bool = True
    note: str = (
        "Conversion rates for weekly Observe. Compare/drawer_open are not success KPIs. "
        "Home Redirect/Dashboard remain LOCKED until Phase B unlock_ready + Owner Why."
    )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    def to_csv_rows(self) -> list[dict[str, str]]:
        """Flat rows for weekly CSV export."""
        rows: list[dict[str, str]] = [
            {"metric": "generated_at", "value": self.generated_at},
            {"metric": "window_days", "value": "" if self.window_days is None else str(self.window_days)},
            {"metric": "phase_b_unlock_ready", "value": str(self.phase_b_unlock_ready)},
            {"metric": "product_ui_locked", "value": str(self.product_ui_locked)},
        ]
        for name, n in sorted(self.counts.items()):
            rows.append({"metric": f"count.{name}", "value": str(n)})
        for name, rate in sorted(self.rates.items()):
            rows.append(
                {
                    "metric": f"rate.{name}",
                    "value": "" if rate is None else f"{rate:.6f}",
                },
            )
        rows.append(
            {
                "metric": "avg_time_to_first_result_ms",
                "value": "" if self.avg_time_to_first_result_ms is None else f"{self.avg_time_to_first_result_ms:.2f}",
            },
        )
        rows.append({"metric": "evidence_tab_clicks", "value": str(self.evidence_tab_clicks)})
        rows.append({"metric": "overview_tab_clicks", "value": str(self.overview_tab_clicks)})
        for excluded in self.excluded_from_success:
            rows.append({"metric": "excluded_success_metric", "value": excluded})
        return rows


def _safe_rate(numerator: int, denominator: int) -> float | None:
    if denominator <= 0:
        return None
    return float(numerator) / float(denominator)


def _parse_created(raw: Any) -> datetime | None:
    if isinstance(raw, datetime):
        return _as_utc(raw)
    if isinstance(raw, str):
        try:
            return _as_utc(datetime.fromisoformat(raw.replace("Z", "+00:00")))
        except ValueError:
            return None
    return None


def aggregate_funnel_rows(
    rows: Sequence[Mapping[str, Any]],
    *,
    window_days: int | None = None,
    unlock_criteria: ObserveUnlockCriteria = DEFAULT_UNLOCK_CRITERIA,
    now: datetime | None = None,
) -> FunnelAnalyticsReport:
    now_utc = _as_utc(now) or datetime.now(timezone.utc)
    window_start = now_utc - timedelta(days=int(window_days)) if window_days is not None else None

    counts = {name: 0 for name in FUNNEL_EVENT_TYPES}
    ttf_ms: list[float] = []
    evidence_tabs = 0
    overview_tabs = 0
    filtered: list[dict[str, Any]] = []

    for row in rows:
        et = str(row.get("event_type") or "")
        created_utc = _parse_created(row.get("created_at"))
        if window_start is not None and created_utc is not None and created_utc < window_start:
            continue
        if et in counts:
            counts[et] += 1
            filtered.append(dict(row))

        payload = row.get("payload") if isinstance(row.get("payload"), Mapping) else row
        meta = _payload_meta(payload if isinstance(payload, Mapping) else None)

        if et == "kpi.time_to_first_result":
            v = meta.get("duration_ms")
            if isinstance(v, (int, float)) and v >= 0:
                ttf_ms.append(float(v))
        if et == "interaction.results_tab_click":
            tab = str(meta.get("tab") or "").lower()
            if tab == "evidence":
                evidence_tabs += 1
            elif tab == "overview":
                overview_tabs += 1

    # Phase B unlock uses Observe subset only (same criteria / no conflict).
    observe_report = aggregate_observe_rows(
        filtered,
        window_days=None,  # already window-filtered above
        criteria=unlock_criteria,
        now=now_utc,
    )

    completed = counts["onboarding.completed"]
    viewed = counts["onboarding.viewed"]
    bookmarks = counts["interaction.bookmark"]
    home = counts["home.viewed"]
    tab_clicks = counts["interaction.results_tab_click"]
    revisits = counts["interaction.revisit"] + counts["interaction.repeated_view"]

    rates: dict[str, float | None] = {
        "onboarding_completion": _safe_rate(completed, viewed),
        # Primary Phase C success: save after survey complete (same denom as debug KPI).
        "bookmark_given_onboarding_completed": _safe_rate(bookmarks, completed),
        # Secondary: saves relative to Home Landing entries (sparse early on).
        "bookmark_given_home_viewed": _safe_rate(bookmarks, home),
        "evidence_tab_given_tab_clicks": _safe_rate(evidence_tabs, tab_clicks),
        "revisit_given_onboarding_completed": _safe_rate(revisits, completed),
    }

    avg_ttf = (sum(ttf_ms) / len(ttf_ms)) if ttf_ms else None

    return FunnelAnalyticsReport(
        window_days=window_days,
        generated_at=now_utc.isoformat(),
        counts=counts,
        rates=rates,
        avg_time_to_first_result_ms=avg_ttf,
        evidence_tab_clicks=evidence_tabs,
        overview_tab_clicks=overview_tabs,
        phase_b_unlock_ready=observe_report.unlock_ready,
        phase_b_unlock_blockers=list(observe_report.unlock_blockers),
        product_ui_locked=True,
    )


def load_funnel_rows_from_db(
    session: Session,
    *,
    window_days: int | None = None,
    limit: int = 50_000,
) -> list[dict[str, Any]]:
    stmt = select(EvalEvent).where(EvalEvent.event_type.in_(FUNNEL_EVENT_TYPES))
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


def aggregate_funnel_from_db(
    session: Session,
    *,
    window_days: int | None = None,
    unlock_criteria: ObserveUnlockCriteria = DEFAULT_UNLOCK_CRITERIA,
    limit: int = 50_000,
) -> FunnelAnalyticsReport:
    rows = load_funnel_rows_from_db(session, window_days=window_days, limit=limit)
    return aggregate_funnel_rows(rows, window_days=window_days, unlock_criteria=unlock_criteria)


def funnel_report_to_csv(report: FunnelAnalyticsReport) -> str:
    lines = ["metric,value"]
    for row in report.to_csv_rows():
        metric = row["metric"].replace('"', '""')
        value = row["value"].replace('"', '""')
        lines.append(f'"{metric}","{value}"')
    return "\n".join(lines) + "\n"


__all__ = [
    "EXCLUDED_SUCCESS_METRICS",
    "FUNNEL_EVENT_TYPES",
    "FunnelAnalyticsReport",
    "aggregate_funnel_from_db",
    "aggregate_funnel_rows",
    "funnel_report_to_csv",
    "load_funnel_rows_from_db",
]
