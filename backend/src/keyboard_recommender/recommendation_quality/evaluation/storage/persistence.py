"""Thin persistence service: orchestrates repository + optional transaction commit."""

from __future__ import annotations

import uuid
from collections.abc import Mapping
from typing import Any

from sqlalchemy.orm import Session

from keyboard_recommender.recommendation_quality.evaluation.scoring import evaluate_recommendation
from keyboard_recommender.recommendation_quality.evaluation.storage.ingestion import (
    ingest_benchmark_report,
    ingest_evaluated_recommendation,
)
from keyboard_recommender.trait_engine.pipeline import TraitEngineResult


class EvaluationPersistenceService:
    """
    Application-facing helper for “evaluate then persist” flows.

    Keeps deterministic evaluation in ``scoring.evaluate_recommendation``; storage only records outputs.
    """

    def __init__(self, session: Session) -> None:
        self._session = session

    def evaluate_and_persist(
        self,
        engine: TraitEngineResult,
        user_trait_scores: Mapping[str, float],
        *,
        survey_answers: Mapping[str, str] | None = None,
        scenario_id: str | None = None,
        request_id: str | None = None,
        source: str | None = None,
        notes: str | None = None,
        config_fingerprint: str | None = None,
        commit: bool = False,
    ) -> uuid.UUID:
        snap, metrics, diag = evaluate_recommendation(
            engine,
            user_trait_scores,
            survey_answers=survey_answers,
        )
        rid = ingest_evaluated_recommendation(
            self._session,
            snap,
            metrics,
            diag,
            scenario_id=scenario_id,
            request_id=request_id,
            source=source,
            notes=notes,
            config_fingerprint=config_fingerprint,
        )
        if commit:
            self._session.commit()
        return rid

    def persist_benchmark(
        self,
        report: Mapping[str, Any],
        *,
        baseline_run_id: uuid.UUID | None = None,
        treatment_run_id: uuid.UUID | None = None,
        scenario_id: str | None = None,
        baseline_label: str | None = None,
        treatment_label: str | None = None,
        commit: bool = False,
    ) -> uuid.UUID:
        bid = ingest_benchmark_report(
            self._session,
            report,
            baseline_run_id=baseline_run_id,
            treatment_run_id=treatment_run_id,
            scenario_id=scenario_id,
            baseline_label=baseline_label,
            treatment_label=treatment_label,
        )
        if commit:
            self._session.commit()
        return bid
