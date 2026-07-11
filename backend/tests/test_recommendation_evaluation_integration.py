"""Operational wiring: recommendation compute + optional evaluation persistence."""

from __future__ import annotations

from collections.abc import Generator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, func, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from keyboard_recommender.api.deps import get_db_for_evaluation, get_settings_dep
from keyboard_recommender.application.evaluation_persistence_hook import (
    persist_recommendation_evaluation_best_effort,
)
from keyboard_recommender.application.recommendation_service import compute_recommendation
from keyboard_recommender.app_factory import create_app
from keyboard_recommender.config.settings import Settings
from keyboard_recommender.infrastructure.persistence.base import Base
from keyboard_recommender.recommendation_quality.evaluation.storage.event_models import (
    EvalBenchmarkRun,
    EvalConfidenceSample,
    EvalDiagnostics,
    EvalEvent,
    EvalMetrics,
    EvalRecommendationRun,
    EvalSnapshot,
)
from keyboard_recommender.schemas.recommendation import SurveyAnswersRequest
from keyboard_recommender.trait_engine.api_envelope import build_recommendation_computation

_VALID_SURVEY = {
    "sound_profile": "muted",
    "typing_pressure": "light",
    "switch_feel": "linear",
    "bottom_out": "soft",
    "volume": "quiet",
}

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
def sqlite_eval_session() -> Generator[Session, None, None]:
    # StaticPool: one shared :memory: DB across connections (TestClient may use another thread).
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _fk(dbapi_connection, connection_record):  # type: ignore[no-untyped-def]
        cur = dbapi_connection.cursor()
        cur.execute("pragma foreign_keys=ON")
        cur.close()

    Base.metadata.create_all(engine, tables=list(_EVAL_TABLES))
    SessionLocal = sessionmaker(bind=engine, future=True)
    s = SessionLocal()
    yield s
    s.close()


def test_compute_recommendation_persistence_disabled_no_db() -> None:
    body = SurveyAnswersRequest.model_validate(_VALID_SURVEY)
    settings = Settings(enable_evaluation_persistence=False)
    out = compute_recommendation(body, settings=settings, db_session=None)
    assert out.recommendations


def test_persist_hook_swallows_ingest_errors(
    sqlite_eval_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    settings = Settings(
        enable_evaluation_persistence=True,
        enable_evaluation_snapshots=True,
        enable_diagnostics_persistence=True,
    )
    _payload, engine, uts, answers = build_recommendation_computation(_VALID_SURVEY)

    def boom(*a, **k):
        raise RuntimeError("simulated_db_failure")

    import keyboard_recommender.application.evaluation_persistence_hook as hook_mod

    monkeypatch.setattr(hook_mod, "ingest_evaluated_recommendation", boom)
    persist_recommendation_evaluation_best_effort(
        sqlite_eval_session,
        settings,
        engine=engine,
        user_trait_scores=uts,
        survey_answers=answers,
        request_id="r1",
        scenario_id="s1",
        api_completed_at_iso="2020-01-01T00:00:00Z",
    )

    n = sqlite_eval_session.execute(select(func.count()).select_from(EvalRecommendationRun)).scalar_one()
    assert int(n) == 0


def test_persist_hook_writes_rows_when_enabled(sqlite_eval_session: Session) -> None:
    settings = Settings(
        enable_evaluation_persistence=True,
        enable_evaluation_snapshots=True,
        enable_diagnostics_persistence=True,
    )
    _payload, engine, uts, answers = build_recommendation_computation(_VALID_SURVEY)
    persist_recommendation_evaluation_best_effort(
        sqlite_eval_session,
        settings,
        engine=engine,
        user_trait_scores=uts,
        survey_answers=answers,
        request_id="req-a",
        scenario_id="scen-b",
        api_completed_at_iso="2020-01-01T00:00:00Z",
    )
    n = sqlite_eval_session.execute(select(func.count()).select_from(EvalRecommendationRun)).scalar_one()
    assert int(n) == 1
    run = sqlite_eval_session.execute(select(EvalRecommendationRun)).scalar_one()
    assert run.request_id == "req-a"
    assert run.scenario_id == "scen-b"
    ev_n = sqlite_eval_session.execute(
        select(func.count()).select_from(EvalEvent).where(EvalEvent.run_id == run.id),
    ).scalar_one()
    assert int(ev_n) == 2


def test_persist_truncates_snapshot_when_flag_off(sqlite_eval_session: Session) -> None:
    settings = Settings(
        enable_evaluation_persistence=True,
        enable_evaluation_snapshots=False,
        enable_diagnostics_persistence=True,
    )
    _payload, engine, uts, answers = build_recommendation_computation(_VALID_SURVEY)
    persist_recommendation_evaluation_best_effort(
        sqlite_eval_session,
        settings,
        engine=engine,
        user_trait_scores=uts,
        survey_answers=answers,
        request_id="r2",
        scenario_id=None,
    )
    snap = sqlite_eval_session.execute(select(EvalSnapshot.body)).scalar_one()
    assert "rankedLists" not in snap
    meta = snap.get("integrationMeta") or {}
    assert meta.get("snapshotTruncated") is True


def test_api_compute_still_200_when_persistence_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    app = create_app()

    def _override_settings() -> Settings:
        return Settings(enable_evaluation_persistence=True)

    def _override_db() -> Generator[Session, None, None]:
        s = MagicMock()

        def commit():
            raise RuntimeError("commit failed")

        s.commit = commit
        s.rollback = MagicMock()
        yield s

    app.dependency_overrides[get_settings_dep] = _override_settings
    app.dependency_overrides[get_db_for_evaluation] = _override_db
    try:
        client = TestClient(app)
        res = client.post("/api/v1/recommendations/compute", json=_VALID_SURVEY)
        assert res.status_code == 200
        assert res.json()["recommendations"]
    finally:
        app.dependency_overrides.clear()


def test_api_persistence_writes_with_sqlite_override(sqlite_eval_session: Session) -> None:
    app = create_app()

    def _override_settings() -> Settings:
        return Settings(
            enable_evaluation_persistence=True,
            enable_async_diagnostics_offload=False,
        )

    def _override_db() -> Generator[Session, None, None]:
        yield sqlite_eval_session

    app.dependency_overrides[get_settings_dep] = _override_settings
    app.dependency_overrides[get_db_for_evaluation] = _override_db
    try:
        client = TestClient(app)
        res = client.post(
            "/api/v1/recommendations/compute",
            json=_VALID_SURVEY,
            headers={"X-Evaluation-Scenario-Id": "api_test", "X-Request-Id": "rid-99"},
        )
        assert res.status_code == 200
    finally:
        app.dependency_overrides.clear()

    n = sqlite_eval_session.execute(select(func.count()).select_from(EvalRecommendationRun)).scalar_one()
    assert int(n) >= 1
    stmt = select(EvalRecommendationRun).where(EvalRecommendationRun.scenario_id == "api_test")
    assert sqlite_eval_session.execute(stmt).scalar_one_or_none() is not None
