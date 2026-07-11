"""Operational ingestion: map Phase-1/2 evaluation outputs into storage rows."""

from __future__ import annotations

import uuid
from collections.abc import Mapping
from typing import Any

from sqlalchemy.orm import Session

from keyboard_recommender.recommendation_quality.evaluation.models import EvaluationMetrics
from keyboard_recommender.recommendation_quality.evaluation.storage.repository import EvaluationRepository


def ingest_evaluated_recommendation(
    session: Session,
    snapshot: Mapping[str, Any],
    metrics: EvaluationMetrics | Mapping[str, float],
    diagnostics: Mapping[str, Any],
    *,
    scenario_id: str | None = None,
    request_id: str | None = None,
    source: str | None = None,
    notes: str | None = None,
    config_fingerprint: str | None = None,
    run_id: uuid.UUID | None = None,
) -> uuid.UUID:
    """
    Persist one full evaluation (snapshot + metrics + diagnostics + confidence + event).

    Caller owns transaction boundaries (commit/rollback on ``session``).
    """
    repo = EvaluationRepository(session)
    return repo.persist_full_evaluation(
        snapshot=snapshot,
        metrics=metrics,
        diagnostics=diagnostics,
        scenario_id=scenario_id,
        request_id=request_id,
        source=source,
        notes=notes,
        config_fingerprint=config_fingerprint,
        run_id=run_id,
    )


def ingest_benchmark_report(
    session: Session,
    report: Mapping[str, Any],
    *,
    baseline_run_id: uuid.UUID | None = None,
    treatment_run_id: uuid.UUID | None = None,
    scenario_id: str | None = None,
    baseline_label: str | None = None,
    treatment_label: str | None = None,
    benchmark_id: uuid.UUID | None = None,
) -> uuid.UUID:
    """Persist a Phase-2 ``build_benchmark_report`` dict and append an ``eval_events`` row."""
    repo = EvaluationRepository(session)
    return repo.persist_benchmark_run(
        report=report,
        baseline_run_id=baseline_run_id,
        treatment_run_id=treatment_run_id,
        scenario_id=scenario_id,
        baseline_label=baseline_label,
        treatment_label=treatment_label,
        benchmark_id=benchmark_id,
    )
