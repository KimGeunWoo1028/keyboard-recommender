"""Rule-based feedback MVP: multipliers, trait nudges, DB-backed loader."""

from __future__ import annotations

import uuid
from collections.abc import Generator
from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

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
from keyboard_recommender.recommendation_quality.feedback_learning.pipeline import load_learning_adjustments
from keyboard_recommender.recommendation_quality.popularity_tracker.aggregates import aggregate_interaction_rows
from keyboard_recommender.trait_engine.catalog_sample import SWITCHES
from keyboard_recommender.trait_engine.matching import rank_parts
from keyboard_recommender.trait_engine.weights import weights_for_switch


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
def eval_event_session() -> Generator[Session, None, None]:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)

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


def test_rank_parts_feedback_multiplier_changes_order() -> None:
    user = {k: 0.0 for k in weights_for_switch()}
    user.update({"smooth": 3.0, "deep_sound": 2.0, "muted": 2.0})
    base = rank_parts(user, SWITCHES, weights_for_switch(), top_k=len(SWITCHES))
    assert len(base) >= 2
    top_id = base[0].part.id
    second_id = base[1].part.id
    mult = {top_id: 0.01, second_id: 25.0}
    adj = rank_parts(user, SWITCHES, weights_for_switch(), top_k=len(SWITCHES), feedback_multipliers=mult)
    top_after = next(r for r in adj if r.part.id == top_id)
    top_before = next(r for r in base if r.part.id == top_id)
    assert top_after.score < top_before.score
    assert adj[0].part.id == second_id


def test_aggregate_interaction_rows_counts_clicks() -> None:
    sid = SWITCHES[0].id
    payloads = [
        {
            "event_type": "interaction.click",
            "scenario_id": "lab1",
            "metadata": {"itemId": sid, "switchFamily": "linear"},
        },
        {
            "event_type": "interaction.click",
            "scenario_id": "lab1",
            "metadata": {"itemId": sid, "switchFamily": "linear"},
        },
    ]
    raw = aggregate_interaction_rows(payloads)
    assert raw.part_clicks[sid] == 2.0
    assert raw.family_clicks.get("linear", 0.0) == 2.0


def test_load_learning_adjustments_from_db(eval_event_session: Session) -> None:
    sid = SWITCHES[0].id
    eval_event_session.add(
        EvalEvent(
            id=uuid.uuid4(),
            created_at=datetime.now(timezone.utc),
            event_type="interaction.click",
            payload={
                "event_type": "interaction.click",
                "scenario_id": "mvp-scen",
                "request_id": "r1",
                "metadata": {"itemId": sid, "switchFamily": "linear"},
            },
        ),
    )
    eval_event_session.commit()
    settings = Settings(
        database_url="postgresql+psycopg://keyboard:keyboard@localhost:5432/keyboard_recommender",
        enable_feedback_learning_mvp=True,
    )
    adj = load_learning_adjustments(eval_event_session, settings, scenario_id="mvp-scen")
    assert adj.part_score_multipliers.get(sid, 1.0) > 1.0
    assert any("배율" in ln or "multiplier" in ln.lower() for ln in adj.explanation_lines)
