"""Unified event schema, normalization, and ``eval_events`` adapter."""

from __future__ import annotations

import uuid
from collections.abc import Generator
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, func, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from keyboard_recommender.api.deps import get_current_user_optional, get_db_for_evaluation, get_settings_dep
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
from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.event_collector.ingest import (
    collect_and_persist_unified_events_best_effort,
)
from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.event_collector.normalize import (
    normalize_raw_unified_event,
)
from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.event_models.schema import (
    UNIFIED_EVENT_SCHEMA_VERSION,
    UnifiedRecommendationEvent,
)
from keyboard_recommender.recommendation_quality.evaluation.unified_pipeline.evaluation_event_adapter.persist import (
    persist_unified_event_to_eval_table,
)

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


def test_normalize_raw_unified_event_defaults() -> None:
    ev = normalize_raw_unified_event(
        {
            "request_id": "r-1",
            "event_type": "interaction.click",
            "metadata": {"targetId": "switch-42"},
        },
    )
    assert ev.request_id == "r-1"
    assert ev.event_type == "interaction.click"
    assert ev.metadata["targetId"] == "switch-42"
    assert ev.schema_version == UNIFIED_EVENT_SCHEMA_VERSION


def test_normalize_raw_onboarding_event_type_is_accepted() -> None:
    ev = normalize_raw_unified_event(
        {
            "request_id": "r-onb-1",
            "event_type": "onboarding.completed",
            "metadata": {"style": "balanced"},
        },
    )
    assert ev.request_id == "r-onb-1"
    assert ev.event_type == "onboarding.completed"
    assert ev.metadata["style"] == "balanced"


def test_normalize_raw_prefilled_step_skipped_event_type_is_accepted() -> None:
    ev = normalize_raw_unified_event(
        {
            "request_id": "r-onb-prefill-1",
            "event_type": "onboarding.prefilled_step_skipped",
            "metadata": {"stepId": "sound_profile", "auto": True},
        },
    )
    assert ev.request_id == "r-onb-prefill-1"
    assert ev.event_type == "onboarding.prefilled_step_skipped"
    assert ev.metadata["auto"] is True


def test_normalize_raw_home_viewed_event_type_is_accepted() -> None:
    ev = normalize_raw_unified_event(
        {
            "request_id": "r-home-1",
            "event_type": "home.viewed",
            "scenario_id": "home_landing_v1",
            "metadata": {"path": "/", "auth": "guest"},
        },
    )
    assert ev.request_id == "r-home-1"
    assert ev.event_type == "home.viewed"
    assert ev.metadata["auth"] == "guest"


def test_normalize_raw_refinement_event_type_is_accepted() -> None:
    ev = normalize_raw_unified_event(
        {
            "request_id": "r-refine-1",
            "event_type": "interaction.refinement",
            "metadata": {"stepId": "sound_profile", "answerId": "muted"},
        },
    )
    assert ev.request_id == "r-refine-1"
    assert ev.event_type == "interaction.refinement"


def test_normalize_raw_resilience_event_type_is_accepted() -> None:
    ev = normalize_raw_unified_event(
        {
            "request_id": "r-resilience-1",
            "event_type": "interaction.retry",
            "metadata": {"trigger": "network_timeout"},
        },
    )
    assert ev.request_id == "r-resilience-1"
    assert ev.event_type == "interaction.retry"


def test_persist_unified_event_links_run_id_from_metadata(sqlite_eval_session: Session) -> None:
    rid = uuid.uuid4()
    sqlite_eval_session.add(
        EvalRecommendationRun(
            id=rid,
            scenario_id="s",
            request_id="req",
            source="test",
        ),
    )
    sqlite_eval_session.flush()
    ev = UnifiedRecommendationEvent(
        request_id="req",
        scenario_id="s",
        event_type="interaction.bookmark",
        metadata={"evalRunId": str(rid)},
    )
    persist_unified_event_to_eval_table(sqlite_eval_session, ev)
    sqlite_eval_session.commit()
    row = sqlite_eval_session.execute(select(EvalEvent).where(EvalEvent.run_id == rid)).scalar_one()
    assert row.event_type == "interaction.bookmark"
    assert row.payload["event_type"] == "interaction.bookmark"


def test_collect_skips_when_unified_disabled(sqlite_eval_session: Session) -> None:
    settings = Settings(
        database_url="postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender",
        enable_evaluation_persistence=True,
        enable_unified_event_ingestion=False,
    )
    n = collect_and_persist_unified_events_best_effort(
        sqlite_eval_session,
        settings,
        [{"request_id": "x", "event_type": "interaction.click", "metadata": {}}],
    )
    assert n == 0
    c = sqlite_eval_session.execute(select(func.count()).select_from(EvalEvent)).scalar_one()
    assert int(c) == 0


def test_post_events_api_skipped_when_persistence_off() -> None:
    app = create_app()

    def _settings() -> Settings:
        return Settings(
            database_url="postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender",
            enable_evaluation_persistence=False,
        )

    def _none_db() -> Generator[Session | None, None, None]:
        yield None

    app.dependency_overrides[get_settings_dep] = _settings
    app.dependency_overrides[get_db_for_evaluation] = _none_db
    try:
        client = TestClient(app)
        res = client.post(
            "/api/v1/recommendations/events",
            json={"events": [{"request_id": "a", "event_type": "interaction.click", "metadata": {}}]},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["stored"] == 0 and body["skipped"] is True
    finally:
        app.dependency_overrides.clear()


def test_post_events_api_stores_when_persistence_on(sqlite_eval_session: Session) -> None:
    app = create_app()

    def _settings() -> Settings:
        return Settings(
            database_url="postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender",
            enable_evaluation_persistence=True,
            enable_unified_event_ingestion=True,
            enable_batch_evaluation_pipeline=False,
        )

    def _db() -> Generator[Session, None, None]:
        yield sqlite_eval_session

    app.dependency_overrides[get_settings_dep] = _settings
    app.dependency_overrides[get_db_for_evaluation] = _db
    try:
        client = TestClient(app)
        res = client.post(
            "/api/v1/recommendations/events",
            json={
                "events": [
                    {"request_id": "e1", "event_type": "interaction.feedback", "metadata": {"rating": 5}},
                ],
            },
        )
        assert res.status_code == 200
        assert res.json()["stored"] == 1
    finally:
        app.dependency_overrides.clear()

    n = sqlite_eval_session.execute(select(func.count()).select_from(EvalEvent)).scalar_one()
    assert int(n) == 1


def test_save_and_list_saved_recommendations(sqlite_eval_session: Session) -> None:
    app = create_app()
    owner = SimpleNamespace(id=uuid.uuid4())

    def _settings() -> Settings:
        return Settings(
            database_url="postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender",
            enable_evaluation_persistence=True,
        )

    def _db() -> Generator[Session, None, None]:
        yield sqlite_eval_session

    app.dependency_overrides[get_settings_dep] = _settings
    app.dependency_overrides[get_db_for_evaluation] = _db
    app.dependency_overrides[get_current_user_optional] = lambda: owner
    try:
        client = TestClient(app)
        anonymous = create_app()
        anonymous.dependency_overrides[get_settings_dep] = _settings
        anonymous.dependency_overrides[get_db_for_evaluation] = _db
        anonymous.dependency_overrides[get_current_user_optional] = lambda: None
        try:
            anon_client = TestClient(anonymous)
            denied = anon_client.post(
                "/api/v1/recommendations/saved",
                json={
                    "request_id": "req-anon",
                    "session_id": "sess-anon",
                    "scenario_id": "scen-1",
                    "build_id": "build-anon",
                    "title": "Anon build",
                    "summary": "Should not account-save.",
                    "components": {"switches": "Silent linear"},
                    "metadata": {},
                },
            )
            assert denied.status_code == 200
            assert denied.json()["saved"] is False
            assert denied.json()["reason"] == "login_required"
            leaked = anon_client.get("/api/v1/recommendations/saved")
            assert leaked.status_code == 200
            assert leaked.json()["items"] == []
        finally:
            anonymous.dependency_overrides.clear()

        res = client.post(
            "/api/v1/recommendations/saved",
            json={
                "request_id": "req-save-1",
                "session_id": "sess-1",
                "scenario_id": "scen-1",
                "build_id": "build-abc",
                "title": "Muted daily build",
                "summary": "Quiet and soft for office use.",
                "components": {"switches": "Silent linear", "plate": "POM"},
                "metadata": {"origin": "results_page"},
            },
        )
        assert res.status_code == 200
        assert res.json()["saved"] is True
        res2 = client.get("/api/v1/recommendations/saved", params={"scenario_id": "scen-1"})
        assert res2.status_code == 200
        items = res2.json()["items"]
        assert len(items) == 1
        assert items[0]["build_id"] == "build-abc"
        assert items[0]["title"] == "Muted daily build"
    finally:
        app.dependency_overrides.clear()


def test_list_saved_recommendations_finds_owner_past_recent_noise(
    sqlite_eval_session: Session,
) -> None:
    """Owner rows must surface even when many other users' bookmarks are newer."""
    app = create_app()
    owner = SimpleNamespace(id=uuid.uuid4())
    other = uuid.uuid4()

    def _settings() -> Settings:
        return Settings(
            database_url="postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender",
            enable_evaluation_persistence=True,
        )

    def _db() -> Generator[Session, None, None]:
        yield sqlite_eval_session

    older = datetime.now(timezone.utc) - timedelta(days=1)
    sqlite_eval_session.add(
        EvalEvent(
            created_at=older,
            event_type="interaction.bookmark",
            correlation_id="req-owner-old",
            payload={
                "event_type": "interaction.bookmark",
                "request_id": "req-owner-old",
                "user_id": str(owner.id),
                "metadata": {
                    "buildId": "build-owner",
                    "title": "Owner keep",
                    "summary": "Should remain listable",
                    "components": {"switches": "Linear"},
                },
            },
        ),
    )
    for i in range(35):
        sqlite_eval_session.add(
            EvalEvent(
                created_at=datetime.now(timezone.utc),
                event_type="interaction.bookmark",
                correlation_id=f"req-noise-{i}",
                payload={
                    "event_type": "interaction.bookmark",
                    "request_id": f"req-noise-{i}",
                    "user_id": str(other),
                    "metadata": {
                        "buildId": f"build-noise-{i}",
                        "title": "Noise",
                        "summary": "",
                        "components": {},
                    },
                },
            ),
        )
    sqlite_eval_session.commit()

    app.dependency_overrides[get_settings_dep] = _settings
    app.dependency_overrides[get_db_for_evaluation] = _db
    app.dependency_overrides[get_current_user_optional] = lambda: owner
    try:
        client = TestClient(app)
        res = client.get("/api/v1/recommendations/saved", params={"limit": 10})
        assert res.status_code == 200
        items = res.json()["items"]
        assert any(it["build_id"] == "build-owner" for it in items)
    finally:
        app.dependency_overrides.clear()
