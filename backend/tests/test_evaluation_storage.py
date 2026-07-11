"""Phase-3 evaluation persistence: repository, ingestion, queries (SQLite subset)."""

from __future__ import annotations

import re
import uuid
from pathlib import Path

import pytest
from sqlalchemy import create_engine, event, func, select
from sqlalchemy.orm import Session, sessionmaker

from keyboard_recommender.infrastructure.persistence.base import Base
from keyboard_recommender.recommendation_quality.evaluation.benchmarking import build_benchmark_report
from keyboard_recommender.recommendation_quality.evaluation.models import EvaluationMetrics
from keyboard_recommender.recommendation_quality.evaluation.storage.event_models import (
    EvalBenchmarkRun,
    EvalConfidenceSample,
    EvalDiagnostics,
    EvalEvent,
    EvalMetrics,
    EvalRecommendationRun,
    EvalSnapshot,
)
from keyboard_recommender.recommendation_quality.evaluation.storage.ingestion import (
    ingest_benchmark_report,
    ingest_evaluated_recommendation,
)
from keyboard_recommender.recommendation_quality.evaluation.storage.queries import (
    confidence_history_rows,
    diagnostics_for_run,
    metric_history_rows,
    operational_trend_bundle,
    recommendation_drift_summary,
    snapshot_for_run,
)
from keyboard_recommender.recommendation_quality.evaluation.drift.drift_summary import build_operational_drift_bundle
from keyboard_recommender.recommendation_quality.evaluation.storage.repository import EvaluationRepository


_EVAL_TABLES = (
    EvalRecommendationRun.__table__,
    EvalSnapshot.__table__,
    EvalMetrics.__table__,
    EvalDiagnostics.__table__,
    EvalConfidenceSample.__table__,
    EvalBenchmarkRun.__table__,
    EvalEvent.__table__,
)


@pytest.fixture
def memory_session() -> Session:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):  # type: ignore[no-untyped-def]
        cursor = dbapi_connection.cursor()
        cursor.execute("pragma foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine, tables=list(_EVAL_TABLES))
    SessionLocal = sessionmaker(bind=engine, future=True)
    s = SessionLocal()
    yield s
    s.close()


def test_repository_persist_full_evaluation_deterministic(memory_session: Session) -> None:
    snap = {
        "schemaVersion": "evaluation.snapshot.v1",
        "userTraitScores": {"deep_sound": 1.0},
        "recommendationConfidence": {"overall": 0.72, "label": "high", "fallbackTier": 0},
    }
    m = EvaluationMetrics(0.6, 0.25, 0.55, 0.8, 0.25, 0.3)
    diag = {"summaryLines": ["line1"], "metricValues": m.as_dict()}
    rid = uuid.uuid4()
    repo = EvaluationRepository(memory_session)
    repo.persist_full_evaluation(
        snapshot=snap,
        metrics=m,
        diagnostics=diag,
        scenario_id="s_det",
        request_id="req-1",
        source="test",
        run_id=rid,
    )
    memory_session.commit()

    r2 = repo.get_run_eager(rid)
    assert r2 is not None
    assert r2.snapshot is not None and r2.snapshot.body["schemaVersion"] == "evaluation.snapshot.v1"
    assert float(r2.metrics.trait_alignment) == 0.6
    assert r2.diagnostics.body["summaryLines"] == ["line1"]
    assert r2.confidence is not None and float(r2.confidence.overall) == 0.72

    ev_count = memory_session.execute(
        select(func.count()).select_from(EvalEvent).where(EvalEvent.run_id == rid),
    ).scalar_one()
    assert ev_count == 1


def test_ingest_and_historical_queries(memory_session: Session) -> None:
    scenario = "s_hist"
    for i in range(6):
        ingest_evaluated_recommendation(
            memory_session,
            {
                "schemaVersion": "evaluation.snapshot.v1",
                "userTraitScores": {"x": float(i)},
                "recommendationConfidence": {"overall": 0.5 + i * 0.01, "label": "mid"},
            },
            EvaluationMetrics(0.5 + i * 0.01, 0.1, 0.5, 0.6 + i * 0.01, 0.1, 0.2),
            {"summaryLines": [f"run-{i}"]},
            scenario_id=scenario,
            source="test",
        )
    memory_session.commit()

    hist = metric_history_rows(memory_session, scenario, limit=10)
    assert len(hist) == 6
    conf = confidence_history_rows(memory_session, scenario, limit=10)
    assert len(conf) == 6

    rid = uuid.UUID(hist[0]["runId"])
    d = diagnostics_for_run(memory_session, rid)
    assert d is not None and any("run-" in x for x in d.get("summaryLines", []))
    s = snapshot_for_run(memory_session, rid)
    assert s is not None and "userTraitScores" in s


def test_operational_trend_and_drift(memory_session: Session) -> None:
    scenario = "s_trend"
    for i in range(8):
        ingest_evaluated_recommendation(
            memory_session,
            {
                "schemaVersion": "evaluation.snapshot.v1",
                "recommendationConfidence": {"overall": 0.4 + i * 0.02, "label": "x"},
            },
            EvaluationMetrics(0.3 + i * 0.02, 0.0, 0.5, 0.5 + i * 0.01, 0.0, 0.2 + i * 0.01),
            {"summaryLines": []},
            scenario_id=scenario,
        )
    memory_session.commit()
    bundle = operational_trend_bundle(memory_session, scenario, limit=16)
    assert bundle["schemaVersion"] == "evaluation.operational_trend_bundle.v1"
    assert bundle["traitAlignment"]["twoWindowTrend"] == "up"

    drift = recommendation_drift_summary(memory_session, scenario, window=8)
    assert drift["status"] == "ok"
    assert "deltaSecondMinusFirst" in drift


def test_operational_drift_bundle(memory_session: Session) -> None:
    scenario = "s_op_drift"
    for i in range(10):
        fam = "linear" if i % 3 else "tactile"
        ingest_evaluated_recommendation(
            memory_session,
            {
                "schemaVersion": "evaluation.snapshot.v1",
                "selected": {"switch": {"family": fam, "itemId": f"sw-{i}"}},
                "recommendationConfidence": {"overall": 0.72 - i * 0.01, "label": "ok"},
                "fallbackAudit": {"recovered": i % 4 == 0},
            },
            EvaluationMetrics(0.5, 0.1 + i * 0.01, 0.5, 0.5, 0.1 + i * 0.02, 0.2 + i * 0.01),
            {"summaryLines": []},
            scenario_id=scenario,
        )
    memory_session.commit()
    out = build_operational_drift_bundle(memory_session, scenario_id=scenario, window=24)
    assert out["schemaVersion"] == "evaluation.drift_bundle.v1"
    assert out["status"] == "ok"
    assert isinstance(out.get("switchFamilyCounts"), dict)
    assert "summaryLines" in out


def test_benchmark_persistence(memory_session: Session) -> None:
    m_a = EvaluationMetrics(0.4, 0.5, 0.4, 0.5, 0.5, 0.2)
    m_b = EvaluationMetrics(0.5, 0.5, 0.5, 0.7, 0.5, 0.35)
    s_a: dict = {"compatibilityAudit": {"effectivePenaltyTotal": 0.6}, "diversityAudit": {"families": []}}
    s_b: dict = {"compatibilityAudit": {"effectivePenaltyTotal": 0.2}, "diversityAudit": {"families": []}}
    report = build_benchmark_report(
        baseline_label="A",
        baseline_snapshot=s_a,
        baseline_metrics=m_a,
        treatment_label="B",
        treatment_snapshot=s_b,
        treatment_metrics=m_b,
    )
    bid = ingest_benchmark_report(memory_session, report, scenario_id="bench1")
    memory_session.commit()
    b = memory_session.get(EvalBenchmarkRun, bid)
    assert b is not None
    assert b.report["schemaVersion"] == "evaluation.benchmark_report.v1"
    n = memory_session.execute(
        select(func.count()).select_from(EvalEvent).where(EvalEvent.benchmark_run_id == bid),
    ).scalar_one()
    assert n == 1


def test_alembic_evaluation_migration_chain() -> None:
    """Lightweight migration sanity check (no live DB)."""
    root = Path(__file__).resolve().parents[1]
    path = root / "alembic" / "versions" / "003_evaluation_storage.py"
    text_content = path.read_text(encoding="utf-8")
    assert 'revision: str = "003_evaluation_storage"' in text_content
    assert 'down_revision: Union[str, None] = "002_keyboard_cases"' in text_content
    assert "op.create_table" in text_content
    assert "eval_recommendation_runs" in text_content
    assert "eval_events" in text_content
    assert re.search(r"def downgrade\(\)", text_content)
